"use client";

import React, { useState } from "react";
import { BookingFormProps } from "@/types";

export default function BookingForm({
    selectedSlots,
    // selectedDate,
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

        // 構建基本用戶資料
        const userData = {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            email: (form.elements.namedItem('email') as HTMLInputElement).value,
            phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
            purpose: (form.elements.namedItem('purpose') as HTMLTextAreaElement).value,
            roomId: selectedRoom
        };

        // 檢查是否有選擇時段
        if (selectedSlots.length === 0) {
            setErrorMessage('請至少選擇一個時段');
            return;
        }

        // Email 驗證
        if (!userData.email.endsWith('@ndhu.edu.tw') && !userData.email.endsWith('@gms.ndhu.edu.tw')) {
            setErrorMessage('請使用東華大學校園信箱');
            return;
        }

        // 構建多時段預約數據
        const multipleSlots = selectedSlots.map(slot => ({
            ...userData,
            date: slot.date,
            time: slot.time,
            action: "submitBooking"
        }));

        // 提交資料
        onSubmit({
            action: "submitBooking",
            isMultipleBooking: true,
            multipleSlots: multipleSlots,
            // 以下是為了兼容原有的單時段設計
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            purpose: userData.purpose,
            roomId: userData.roomId,
            date: selectedSlots[0].date,
            timeSlot: selectedSlots[0].time
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3">
                <h3 className="font-bold text-blue-800">多時段預約</h3>
                <p className="text-blue-600">您已選擇 {selectedSlots.length} 個時段進行預約</p>
                <div className="mt-2 flex flex-wrap gap-1">
                    {selectedSlots.map((slot, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            {slot.date} {slot.time}-{slot.endTime || ""}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="name" className="font-semibold">姓名：</label>
                <input
                    id="name"
                    name="name"
                    placeholder="請輸入您的姓名"
                    required
                    className="border p-2 w-full rounded"
                    defaultValue={'咕嚕'}
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
                    defaultValue={'411111226@gms.ndhu.edu.tw'}
                />
                <small className="text-gray-500">必須使用 @ndhu.edu.tw 或 @gms.ndhu.edu.tw 信箱</small>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="font-semibold">聯絡電話：</label>
                <input
                    id="phone"
                    name="phone"
                    placeholder="請輸入您的聯絡電話"
                    required
                    className="border p-2 w-full rounded"
                    defaultValue={'0987654321'}
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
                    defaultValue={'預約空間'}
                ></textarea>
            </div>

            <div className="flex flex-col gap-2">
                <label className="font-semibold">預約教室：</label>
                <p className="p-2 bg-gray-100 rounded">
                    {roomName || selectedRoom}
                </p>
            </div>

            {errorMessage && (
                <div className="text-red-600 font-medium p-2 bg-red-50 border border-red-200 rounded">
                    {errorMessage}
                </div>
            )}

            <div className="flex gap-4 mt-2">
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    確認預約 ({selectedSlots.length} 個時段)
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