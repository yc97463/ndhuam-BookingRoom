"use client";

import React, { useState, useEffect, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import RoomSelector from "@/components/RoomSelector";
import DateSelector from "@/components/DateSelector";
import ScheduleGrid from "@/components/ScheduleGrid";
import BookingForm from "@/components/BookingForm";
import LoadingMask from "@/components/LoadingMask";

const GOOGLE_SCRIPT_URL = "./api/proxy";

const fetcher = (url: string | URL | Request) => fetch(url).then(res => res.json());

const BookingSystem = () => {
  const [selectedSlots, setSelectedSlots] = useState<Array<{ date: string; time: string; endTime?: string }>>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // 使用 SWR 獲取教室列表
  const {
    data: rooms,
    error: roomsError,
    isLoading: roomsLoading
  } = useSWR(`${GOOGLE_SCRIPT_URL}?action=getRooms`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600000
  });

  // 使用 SWR 獲取預約時段資料
  const scheduleKey = selectedRoom
    ? `${GOOGLE_SCRIPT_URL}?action=getTimeSlots&date=${selectedDate}&room=${selectedRoom}`
    : null;

  const {
    data: scheduleData,
    error: scheduleError,
    isLoading: scheduleLoading,
    mutate: refreshSchedule
  } = useSWR(scheduleKey, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
    onSuccess: (data) => {
      console.log('Successfully fetched schedule data for date:', selectedDate);
    },
    onError: (err) => {
      console.error('Error fetching schedule data:', err);
    },
    revalidateIfStale: true,
    revalidateOnMount: true,
    refreshInterval: 0,
    shouldRetryOnError: true
  });

  // 選擇第一個教室作為默認值
  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].roomId);
    }
  }, [rooms, selectedRoom]);

  // 處理時段選擇
  const handleSlotSelection = useCallback((slot: { date: any; time: any; endTime?: string | undefined; }) => {
    setSelectedSlots(prevSelectedSlots => {
      // 檢查是否已選擇此時段
      const existingIndex = prevSelectedSlots.findIndex(
        s => s.date === slot.date && s.time === slot.time
      );

      if (existingIndex >= 0) {
        // 已選擇，則移除此時段
        return prevSelectedSlots.filter((_, index) => index !== existingIndex);
      } else {
        // 未選擇，則添加此時段
        return [...prevSelectedSlots, slot];
      }
    });
  }, []);

  // DateSelector 處理函數
  const handleDateChange = (newDate: React.SetStateAction<string>) => {
    setSelectedDate(newDate);

    if (selectedRoom) {
      const newScheduleKey = `${GOOGLE_SCRIPT_URL}?action=getTimeSlots&date=${newDate}&room=${selectedRoom}`;
      console.log('Refreshing schedule with new date:', newDate);
      mutate(newScheduleKey, undefined, { revalidate: true });
    }
  };

  // 調整日期並強制重新獲取時間表
  const adjustDate = (days: any) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    const newDate = currentDate.toISOString().split("T")[0];
    handleDateChange(newDate);
  };

  // 決定是否顯示加載中
  const isLoading = roomsLoading || scheduleLoading;

  const handleBookingSubmit = async (bookingData: { multipleSlots: string[] | any[]; }) => {
    try {
      // 顯示加載中
      const loadingKey = 'booking-submitting';
      mutate(loadingKey, true, false);

      console.log('Submitting booking data:', bookingData); // 檢查數據格式

      const response = await fetch(`${GOOGLE_SCRIPT_URL}`, {
        method: "POST",
        body: JSON.stringify({
          action: "submitBooking",
          isMultipleBooking: true,
          ...bookingData,
          multipleSlots: bookingData.multipleSlots || [bookingData],
        }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      console.log('Booking response:', result); // 檢查回應

      if (result.success) {
        const slotCount = bookingData.multipleSlots?.length || 1;
        alert(`預約成功！已預約 ${slotCount} 個時段，驗證信已發送至您的信箱。`);
        setSelectedSlots([]);
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
                className="border border-gray-300 px-3 py-2 rounded cursor-pointer  hover:bg-gray-100"
                onClick={() => adjustDate(-7)}
              >
                -7
              </button>
              <DateSelector selectedDate={selectedDate} onChange={handleDateChange} />
              <button
                className="border border-gray-300 px-3 py-2 rounded cursor-pointer  hover:bg-gray-100"
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
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
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
              className="ml-2 border border-gray-300 px-4 py-2 rounded text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedSlots([])}
            >
              清除選擇
            </button>
          </div>
        </div>
      )}

      {selectedSlots.length > 0 && (
        <div id="booking-form-section" className="mt-6 p-4 border rounded bg-gray-50">
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