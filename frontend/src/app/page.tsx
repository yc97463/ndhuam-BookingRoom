"use client";

import React, { useState, useEffect, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import RoomSelector from "@/components/RoomSelector";
import DateSelector from "@/components/DateSelector";
import ScheduleGrid from "@/components/ScheduleGrid";
import BookingForm from "@/components/BookingForm";
import LoadingMask from "@/components/LoadingMask";
import { BookingDataProps } from '@/types';

// API 基礎 URL
const API_URL = `https://ndhuam-bookingroom-proxy.deershark-tech.workers.dev/`;

// SWR fetcher 函數
const fetcher = (url: string | URL | Request) => fetch(url).then(res => res.json());

const BookingSystem = () => {
  // 狀態管理
  const [selectedSlots, setSelectedSlots] = useState<Array<{ date: string; time: string; endTime?: string }>>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // 專門用於表單提交的加載狀態
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== SWR API 獲取部分 =====

  // 1. 獲取教室列表 API
  const {
    data: rooms,
    error: roomsError,
    isLoading: roomsLoading
  } = useSWR(`${API_URL}?action=getRooms`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600000 // 10分鐘內不重複請求
  });

  // 2. 獲取預約時段資料 API
  const scheduleKey = selectedRoom
    ? `${API_URL}?action=getTimeSlots&date=${selectedDate}&room=${selectedRoom}`
    : null;

  const {
    data: scheduleData,
    error: scheduleError,
    isLoading: scheduleLoading,
    mutate: refreshSchedule
  } = useSWR(scheduleKey, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
    revalidateIfStale: true,
    revalidateOnMount: true,
    shouldRetryOnError: true
  });

  // 整合所有加載狀態
  const isLoading = roomsLoading || scheduleLoading || isSubmitting;

  // 選擇第一個教室作為默認值
  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].roomId);
    }
  }, [rooms, selectedRoom]);

  // 處理時段選擇
  const handleSlotSelection = useCallback((slot: { date: string; time: string; endTime?: string | undefined; }) => {
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

  // 日期變更處理函數
  const handleDateChange = (newDate: React.SetStateAction<string>) => {
    setSelectedDate(newDate);

    if (selectedRoom) {
      const newScheduleKey = `${API_URL}?action=getTimeSlots&date=${newDate}&room=${selectedRoom}`;
      mutate(newScheduleKey, undefined, { revalidate: true });
    }
  };

  // 日期調整函數
  const adjustDate = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    const newDate = currentDate.toISOString().split("T")[0];
    handleDateChange(newDate);
  };

  // 預約提交處理函數
  const handleBookingSubmit = async (bookingData: BookingDataProps) => {
    try {
      // 設置提交中狀態
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
        // 刷新時段資料
        refreshSchedule();
      } else {
        alert("預約失敗：" + (result.error || "請稍後再試"));
      }
    } catch (err) {
      console.error('Error submitting booking:', err);
      alert("預約失敗，請稍後再試。");
    } finally {
      // 無論成功或失敗，都結束加載狀態
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 font-sans">
      {/* 全局加載遮罩 */}
      <LoadingMask loading={isLoading} />

      <h1 className="text-2xl font-bold mb-4">應數系空間預約系統</h1>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        {roomsError ? (
          <p className="text-red-500">無法載入教室</p>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex items-center gap-2">
              <label className="font-semibold">選擇教室：</label>
              <RoomSelector
                rooms={rooms || []}
                selectedRoom={selectedRoom}
                onSelect={setSelectedRoom}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold">選擇日期：</label>
              <button
                className="border border-gray-300 px-3 py-2 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => adjustDate(-7)}
              >
                -7
              </button>
              <DateSelector selectedDate={selectedDate} onChange={handleDateChange} />
              <button
                className="border border-gray-300 px-3 py-2 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => adjustDate(7)}
              >
                +7
              </button>
            </div>

            <div className="flex items-center">
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={() => refreshSchedule()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

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

      {/* 選擇的時段顯示區域 */}
      {selectedSlots.length > 0 && (
        <div className="mt-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-semibold text-blue-700">已選擇 {selectedSlots.length} 個時段</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedSlots.map((slot, index) => (
              <div
                key={`${slot.date}-${slot.time}`}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <span>{slot.date} {slot.time}-{slot.endTime}</span>
                <button
                  className="ml-2 text-blue-600 hover:text-blue-800 cursor-pointer"
                  onClick={() => {
                    setSelectedSlots(slots => slots.filter((_, i) => i !== index));
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors cursor-pointer"
              onClick={() => {
                // 檢查是否選擇了時段
                if (selectedSlots.length > 0) {
                  // 顯示預約表單
                  document.getElementById('booking-form-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              預約所選時段
            </button>
            <button
              className="ml-2 border border-gray-300 px-4 py-2 rounded text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => setSelectedSlots([])}
            >
              清除選擇
            </button>
          </div>
        </div>
      )}

      {/* 預約表單區域 */}
      {selectedSlots.length > 0 && (
        <div id="booking-form-section" className="mt-6 p-4 border rounded bg-gray-50">
          {/* ... 表單內容保持不變 ... */}
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