"use client";

import { useState, useEffect } from "react";
import RoomSelector from "@/components/RoomSelector";
import DateSelector from "@/components/DateSelector";
import ScheduleGrid from "@/components/ScheduleGrid";
import BookingForm from "@/components/BookingForm";
import { BookingDataProps, Room } from "@/types";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"; // Google Script Web App API

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  useEffect(() => {
    fetch(`${GOOGLE_SCRIPT_URL}/getRooms`)
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        if (data.length > 0) setSelectedRoom(data[0].roomId);
      });
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;
    setLoading(true);
    fetch(`${GOOGLE_SCRIPT_URL}/getTimeSlots?date=${selectedDate}&room=${selectedRoom}`)
      .then((res) => res.json())
      .then((data) => {
        setScheduleData(data);
        setLoading(false);
      });
  }, [selectedRoom, selectedDate]);

  const handleBookingSubmit = (bookingData: BookingDataProps) => {
    setLoading(true);
    fetch(`${GOOGLE_SCRIPT_URL}/submitBooking`, {
      method: "POST",
      body: JSON.stringify(bookingData),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((response) => {
        setLoading(false);
        if (response.success) {
          alert("預約成功！驗證信已發送至您的信箱。");
          setSelectedSlot(null);
          fetch(`${GOOGLE_SCRIPT_URL}/getTimeSlots?date=${selectedDate}&room=${selectedRoom}`)
            .then((res) => res.json())
            .then((data) => setScheduleData(data));
        } else {
          alert("預約失敗：" + response.error);
        }
      })
      .catch((error) => {
        setLoading(false);
        alert("預約發生錯誤：" + error.message);
      });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">應數系空間預約系統</h1>
      <div className="flex flex-col gap-4">
        <RoomSelector rooms={rooms} selectedRoom={selectedRoom} onSelect={setSelectedRoom} />
        <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />
        {loading ? <p>載入中...</p> : <ScheduleGrid data={scheduleData} onSelectSlot={setSelectedSlot} />}
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
