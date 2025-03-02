"use client";

import React, { useState } from "react";
import { BookingFormProps } from "@/types";

export default function BookingForm({
    selectedSlot,
    selectedDate,
    selectedRoom,
    roomName,
    onClose,
    onSubmit
}: BookingFormProps) {
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage("");

        const form = event.target as HTMLFormElement;
        const data = {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            email: (form.elements.namedItem('email') as HTMLInputElement).value,
            phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
            date: selectedDate,
            timeSlot: selectedSlot.time,
            roomId: selectedRoom,
            purpose: (form.elements.namedItem('purpose') as HTMLTextAreaElement).value,
        };

        // Email validation for university domain
        if (!data.email.endsWith('@ndhu.edu.tw') && !data.email.endsWith('@gms.ndhu.edu.tw')) {
            setErrorMessage('請使用東華大學校園信箱');
            return;
        }

        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label htmlFor="name" className="font-semibold">姓名：</label>
                <input
                    id="name"
                    name="name"
                    placeholder="請輸入您的姓名"
                    required
                    className="border p-2 w-full rounded"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-semibold">電子郵件：</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="請輸入東華大學校園信箱"
                    required
                    className="border p-2 w-full rounded"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="font-semibold">聯絡電話：</label>
                <input
                    id="phone"
                    name="phone"
                    placeholder="請輸入您的聯絡電話"
                    required
                    className="border p-2 w-full rounded"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="purpose" className="font-semibold">預約用途：</label>
                <textarea
                    id="purpose"
                    name="purpose"
                    placeholder="請詳細說明使用空間的目的"
                    rows={3}
                    required
                    className="border p-2 w-full rounded"
                ></textarea>
            </div>

            <div className="flex flex-col gap-2">
                <label className="font-semibold">預約時間：</label>
                <p className="p-2 bg-gray-100 rounded">
                    {selectedDate} {selectedSlot.time} - {selectedSlot.endTime || ""} ({roomName || selectedRoom})
                </p>
            </div>

            {errorMessage && (
                <div className="text-red-600 font-medium">{errorMessage}</div>
            )}

            <div className="flex gap-4 mt-2">
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    確認預約
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    取消
                </button>
            </div>
        </form>
    );
}