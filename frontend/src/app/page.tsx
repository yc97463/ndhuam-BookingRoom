// page.tsx 或 BookingSystem.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import SystemHeader from "@/components/SystemHeader";
import ScheduleGrid from "@/components/ScheduleGrid";
import SelectedSlots from "@/components/SelectedSlots";
import BookingForm from "@/components/BookingForm";
import LoadingMask from "@/components/LoadingMask";
import { BookingDataProps, BookingSystemProps } from '@/types';

// API 基礎 URL
const API_URL = `https://ndhuam-bookingroom-proxy.deershark-tech.workers.dev/`;

// SWR fetcher 函數
const fetcher = (url: string) => fetch(url).then(res => res.json());

const BookingSystem = () => {
  // 所有狀態和邏輯保持不變
  const [selectedSlots, setSelectedSlots] = useState<BookingSystemProps[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SWR API 獲取部分
  const { data: rooms, error: roomsError, isLoading: roomsLoading } = useSWR(`${API_URL}?action=getRooms`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600000
  });

  const scheduleKey = selectedRoom ? `${API_URL}?action=getTimeSlots&date=${selectedDate}&room=${selectedRoom}` : null;
  const { data: scheduleData, error: scheduleError, isLoading: scheduleLoading, mutate: refreshSchedule } = useSWR(scheduleKey, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
    revalidateIfStale: true,
    revalidateOnMount: true,
    shouldRetryOnError: true
  });

  const isLoading = roomsLoading || scheduleLoading || isSubmitting;

  // 其他邏輯...
  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].roomId);
    }
  }, [rooms, selectedRoom]);

  // 處理函數...
  const handleSlotSelection = useCallback((slot: BookingSystemProps) => {
    setSelectedSlots(prevSelectedSlots => {
      const existingIndex = prevSelectedSlots.findIndex(
        s => s.date === slot.date && s.time === slot.time
      );

      if (existingIndex >= 0) {
        return prevSelectedSlots.filter((_, index) => index !== existingIndex);
      } else {
        return [...prevSelectedSlots, slot];
      }
    });
  }, []);

  const handleDateChange = (newDate: React.SetStateAction<string>) => {
    setSelectedDate(newDate);
    if (selectedRoom) {
      const newScheduleKey = `${API_URL}?action=getTimeSlots&date=${newDate}&room=${selectedRoom}`;
      mutate(newScheduleKey, undefined, { revalidate: true });
    }
  };

  const adjustDate = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    const newDate = currentDate.toISOString().split("T")[0];
    handleDateChange(newDate);
  };

  const handleBookingSubmit = async (bookingData: BookingDataProps) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          isMultipleBooking: true,
          ...bookingData,
          action: "submitBooking",
          multipleSlots: bookingData.multipleSlots || [bookingData],
        }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (result.success) {
        const slotCount = bookingData.multipleSlots?.length || 1;
        alert(`預約成功！已預約 ${slotCount} 個時段，驗證信已發送至您的信箱。`);
        setSelectedSlots([]);
        refreshSchedule(undefined, { revalidate: true });
      } else {
        alert("預約失敗：" + (result.error || "請稍後再試"));
      }
    } catch (err) {
      console.error('Error submitting booking:', err);
      alert("預約失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 font-sans">
      {/* 全局加載遮罩 */}
      <LoadingMask loading={isLoading} />

      {/* 系統頭部和控制區域 */}
      <SystemHeader
        rooms={rooms || []}
        selectedRoom={selectedRoom}
        selectedDate={selectedDate}
        roomsError={roomsError}
        onRoomSelect={setSelectedRoom}
        onDateChange={handleDateChange}
        onDateAdjust={adjustDate}
        onRefresh={() => refreshSchedule(undefined, { revalidate: true })}
        isRefreshing={isLoading}
      />

      {/* 時段顯示區域 */}
      <div className="overflow-x-auto">
        {scheduleError ? (
          <p className="text-red-500">無法載入時段</p>
        ) : scheduleData ? (
          <ScheduleGrid
            data={scheduleData}
            selectedSlots={selectedSlots}
            onSelectSlot={handleSlotSelection}
          />
        ) : (
          <p>無可用時段</p>
        )}
      </div>

      {/* 已選擇時段區域 */}
      <SelectedSlots
        slots={selectedSlots}
        onRemoveSlot={(index) => {
          setSelectedSlots(slots => slots.filter((_, i) => i !== index));
        }}
        onClearAll={() => setSelectedSlots([])}
        onProceed={() => {
          document.getElementById('booking-form-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 預約表單區域 */}
      {selectedSlots.length > 0 && (
        <div id="booking-form-section" className="mt-6 p-4 border rounded bg-gray-50">
          <BookingForm
            selectedSlots={selectedSlots}
            selectedDate={selectedDate}
            selectedRoom={selectedRoom}
            roomName={rooms?.find((room: { roomId: string; }) => room.roomId === selectedRoom)?.roomName || selectedRoom}
            onClose={() => setSelectedSlots([])}
            onSubmit={handleBookingSubmit}
          />
        </div>
      )}
    </div>
  );
};

export default BookingSystem;