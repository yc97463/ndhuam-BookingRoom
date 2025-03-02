"use client";

import { BookingFormProps } from "@/types";

export default function BookingForm({ selectedSlot, selectedDate, selectedRoom, onClose, onSubmit }: BookingFormProps) {
    const handleSubmit = (event: any) => {
        event.preventDefault();
        const data = {
            name: event.target.name.value,
            email: event.target.email.value,
            phone: event.target.phone.value,
            date: selectedDate,
            timeSlot: selectedSlot.time,
            roomId: selectedRoom,
            purpose: event.target.purpose.value,
        };
        onSubmit(data);
    };

    return (
        <div className="p-4 border rounded bg-gray-100">
            <h2 className="text-lg font-bold">預約申請表單</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <input name="name" placeholder="姓名" required className="border p-2 w-full rounded" />
                <input name="email" type="email" placeholder="電子郵件" required className="border p-2 w-full rounded" />
                <input name="phone" placeholder="聯絡電話" required className="border p-2 w-full rounded" />
                <textarea name="purpose" placeholder="預約用途" required className="border p-2 w-full rounded"></textarea>
                <p className="text-sm">預約時間：{selectedDate} {selectedSlot.time}</p>
                <div className="flex gap-2">
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">確認預約</button>
                    <button type="button" onClick={onClose} className="text-gray-500">取消</button>
                </div>
            </form>
        </div>
    );
}
