"use client";

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import RoomSelector from "@/components/RoomSelector";
import DateSelector from "@/components/DateSelector";
import ScheduleGrid from "@/components/ScheduleGrid";
import BookingForm from "@/components/BookingForm";
import LoadingMask from "@/components/LoadingMask";

const GOOGLE_SCRIPT_URL = "./api/proxy";
const fetcher = (url: string) => fetch(url).then(res => res.json());

const BookingSystem = () => {
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  // 使用 SWR 獲取教室列表
  const {
    data: rooms,
    error: roomsError,
    isLoading: roomsLoading
  } = useSWR(`${GOOGLE_SCRIPT_URL}?action=getRooms`, fetcher);

  // 使用 SWR 獲取預約時段資料
  const {
    data: scheduleData,
    error: scheduleError,
    isLoading: scheduleLoading,
    mutate: refreshSchedule
  } = useSWR(
    selectedRoom
      ? `${GOOGLE_SCRIPT_URL}?action=getTimeSlots&date=${selectedDate}&room=${selectedRoom}`
      : null,
    fetcher
  );

  // 選擇第一個教室作為默認值
  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].roomId);
    }
  }, [rooms, selectedRoom]);

  // 決定是否顯示加載中
  const isLoading = roomsLoading || scheduleLoading;

  const handleBookingSubmit = async (bookingData: any) => {
    try {
      // 顯示加載中
      const loadingKey = 'booking-submitting';
      mutate(loadingKey, true, false);

      const response = await fetch(`${GOOGLE_SCRIPT_URL}`, {
        method: "POST",
        body: JSON.stringify({ action: "submitBooking", ...bookingData }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (result.success) {
        alert("預約成功！驗證信已發送至您的信箱。");
        setSelectedSlot(null);
        // 刷新時段資料
        refreshSchedule();
      } else {
        alert("預約失敗：" + (result.error || "請稍後再試"));
      }

      // 結束加載
      mutate(loadingKey, false, false);
    } catch (err) {
      console.error('Error submitting booking:', err);
      alert("預約失敗，請稍後再試。");
    }
  };

  const adjustDate = (days: any) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  return (
    <div className="p-4 font-sans">
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
                className="border border-gray-300 px-3 py-2 rounded hover:bg-gray-100"
                onClick={() => adjustDate(-7)}
              >
                -7
              </button>
              <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />
              <button
                className="border border-gray-300 px-3 py-2 rounded hover:bg-gray-100"
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
            onSelectSlot={setSelectedSlot}
          />
        ) : (
          <p>無可用時段</p>
        )}
      </div>

      {selectedSlot && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-bold mb-4">預約申請表單</h2>

          <div className="bg-white p-4 border rounded mb-4">
            <h3 className="font-bold mb-2">預約說明</h3>
            <ul className="list-disc pl-5 mb-3">
              <li>預約流程：申請預約（NOW） → 信箱驗證 → 系所審核 → 收到通知 → 系辦領鑰匙🔑</li>
              <li>申請人限制：東華大學校內教職員工、學生，使用校園信箱驗證。</li>
            </ul>
            <p>使用系統時若有任何問題，請電洽 <a href="tel:03-8903513" className="text-blue-500 hover:underline">03-8903513</a> 聯絡應數系辦。</p>
          </div>

          <BookingForm
            selectedSlot={selectedSlot}
            selectedDate={selectedDate}
            selectedRoom={selectedRoom}
            roomName={rooms?.find((room: { roomId: string; }) => room.roomId === selectedRoom)?.roomName || selectedRoom}
            onClose={() => setSelectedSlot(null)}
            onSubmit={handleBookingSubmit}
          />
        </div>
      )}
    </div>
  );
};

export default BookingSystem;