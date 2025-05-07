// page.tsx 或 BookingSystem.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import SystemHeader from "@/components/layouts/AppHeader";
import ScheduleGrid from "@/components/ScheduleGrid";
import SelectedSlots from "@/components/SelectedSlots";
import BookingForm from "@/components/BookingForm";
import LoadingMask from "@/components/LoadingMask";
import { BookingDataProps, BookingSystemProps, Room } from '@/types';
import AppFooter from '@/components/layouts/AppFooter';
import { Calendar, Info } from 'lucide-react';

// API 基礎 URL
const API_URL = `/api`;

// SWR fetcher 函數
const fetcher = (url: string) => fetch(url).then(res => res.json());

const BookingSystem = () => {
  // 所有狀態和邏輯保持不變
  const [selectedSlots, setSelectedSlots] = useState<BookingSystemProps[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // SWR API 獲取部分
  const { data: rooms, error: roomsError, isLoading: roomsLoading } = useSWR(`${API_URL}/rooms`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600000
  });

  const scheduleKey = selectedRoom ? `${API_URL}/schedule?date=${selectedDate}&room=${selectedRoom}` : null;
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
      const newScheduleKey = `${API_URL}/schedule?date=${newDate}&room=${selectedRoom}`;
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
      const response = await fetch(`${API_URL}/applications`, {
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
        alert(`預約成功！已預約 ${slotCount} 個時段，${result.message}`);
        setSelectedSlots([]);
        refreshSchedule(undefined, { revalidate: true });
        setShowBookingForm(false);
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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-4">
        <LoadingMask loading={isLoading} />

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
          onClearSlots={() => setSelectedSlots([])}
        />

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

        {/* Floating selected slots */}
        <SelectedSlots
          slots={selectedSlots}
          onRemoveSlot={(index) => {
            setSelectedSlots(slots => slots.filter((_, i) => i !== index));
          }}
          onClearAll={() => setSelectedSlots([])}
          onProceed={() => setShowBookingForm(true)}
        />

        {/* Booking form modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 backdrop-blur-sm" onClick={() => setShowBookingForm(false)}>
            <div
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl mx-4 border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-lg shadow-sm">
                    <Calendar size={20} className="text-white/90" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">預約申請</h2>
                    <p className="text-sm text-gray-500">請填寫以下資訊完成申請</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Info size={18} />
                    預約說明
                  </h3>
                  <ul className="list-disc pl-5 mb-3 text-sm text-blue-700 space-y-1">
                    <li>預約流程：申請預約（NOW） → 信箱收信 → 系所審核 → 收到通知 → 上班時間領鑰匙🔑</li>
                    <li>申請人限制：東華大學校內教職員工、學生，使用校園信箱驗證。</li>
                  </ul>
                  <p className="text-sm text-blue-700">使用系統時若有任何問題，請聯絡 <a href="https://am.ndhu.edu.tw/p/412-1038-17041.php?Lang=zh-tw" className="text-blue-600 font-medium hover:underline">應數系辦助理</a>。</p>
                </div>
              </div>

              <BookingForm
                selectedSlots={selectedSlots}
                selectedDate={selectedDate}
                selectedRoom={selectedRoom}
                roomId={selectedRoom}
                roomName={rooms?.find((room: Room) => room.roomId === selectedRoom)?.roomName || selectedRoom}
                onClose={() => setShowBookingForm(false)}
                onSubmit={handleBookingSubmit}
              />
            </div>
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
};

export default BookingSystem;