"use client";

import { useState } from "react";
import useSWR from "swr";
import RoomSelector from "@/components/RoomSelector";
import DateSelector from "@/components/DateSelector";
import ScheduleGrid from "@/components/ScheduleGrid";
import BookingForm from "@/components/BookingForm";

const GOOGLE_SCRIPT_URL = "./api/proxy";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  // Fetch rooms
  const { data: rooms, error: roomsError } = useSWR(`${GOOGLE_SCRIPT_URL}?action=getRooms`, fetcher);

  // Fetch schedule
  const {
    data: scheduleData,
    error: scheduleError,
    mutate: refreshSchedule,
  } = useSWR(
    selectedRoom
      ? `${GOOGLE_SCRIPT_URL}?action=getTimeSlots&date=${selectedDate}&room=${selectedRoom}`
      : null,
    fetcher
  );

  // Select first room by default
  useState(() => {
    if (rooms && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].roomId);
    }
  });

  const handleBookingSubmit = async (bookingData: any) => {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}`, {
      method: "POST",
      body: JSON.stringify({ action: "submitBooking", ...bookingData }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    if (result.success) {
      alert("預約成功！請檢查您的信箱。");
      setSelectedSlot(null);
      refreshSchedule();
    } else {
      alert("預約失敗：" + result.error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">應數系空間預約系統</h1>
      <div className="flex flex-col gap-4">
        {roomsError ? (
          <p className="text-red-500">無法載入教室</p>
        ) : (
          <RoomSelector rooms={rooms || []} selectedRoom={selectedRoom} onSelect={setSelectedRoom} />
        )}

        <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />

        {scheduleError ? (
          <p className="text-red-500">無法載入時段</p>
        ) : (
          <ScheduleGrid
            data={scheduleData ?? { days: [], timeSlots: [], bookedSlots: {} }}
            onSelectSlot={setSelectedSlot}
          />
        )}
      </div>

      {selectedSlot && (
        <BookingForm
          selectedSlot={selectedSlot}
          selectedDate={selectedDate}
          selectedRoom={selectedRoom}
          onClose={() => setSelectedSlot(null)}
          onSubmit={handleBookingSubmit}
        />
      )}
    </div>
  );
}
