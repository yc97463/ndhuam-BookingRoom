"use client";

import React, { useState } from "react";
import { BookingFormProps } from "@/types";
import { User, Building, Phone, Mail, FileText, School, AlertCircle } from 'lucide-react';

export default function BookingForm({
    selectedSlots,
    // selectedDate,
    selectedRoom,
    roomId,
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
            organization: (form.elements.namedItem('organization') as HTMLInputElement).value,
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
        if (!userData.email.endsWith('ndhu.edu.tw')) {
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
            organization: userData.organization,
            phone: userData.phone,
            purpose: userData.purpose,
            roomId: userData.roomId,
            date: selectedSlots[0].date,
            timeSlot: selectedSlots[0].time
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <User size={15} className="text-gray-400" />
                        申請人姓名
                    </label>
                    <input
                        id="name"
                        name="name"
                        placeholder="請輸入您的姓名"
                        required
                        className="border border-gray-200 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="organization" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Building size={15} className="text-gray-400" />
                        單位 / 系級
                    </label>
                    <input
                        id="organization"
                        name="organization"
                        placeholder="請輸入您的單位或系級"
                        required
                        className="border border-gray-200 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Phone size={15} className="text-gray-400" />
                        聯絡電話
                    </label>
                    <input
                        id="phone"
                        name="phone"
                        placeholder="請輸入您的聯絡電話"
                        required
                        className="border border-gray-200 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Mail size={15} className="text-gray-400" />
                    電子郵件
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="請輸入東華大學校園信箱"
                    required
                    className="border border-gray-200 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <div className="text-xs text-gray-500 ml-3">
                    <li>提供東華教職員生借用，僅受理來自 @ndhu.edu.tw 或 @gms.ndhu.edu.tw 電子郵件的申請。</li>
                    <li>如果您是校外人士欲借用此系統管理的空間，請聯絡 <a href="https://am.ndhu.edu.tw/p/412-1038-17041.php?Lang=zh-tw" className="text-blue-600 hover:underline">應數系辦助理</a>。</li>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="purpose" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <FileText size={15} className="text-gray-400" />
                    預約用途
                </label>
                <textarea
                    id="purpose"
                    name="purpose"
                    placeholder="請詳細說明使用空間的目的"
                    rows={3}
                    required
                    className="border border-gray-200 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                ></textarea>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <School size={15} className="text-gray-400" />
                    預約教室
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium text-sm">
                        {roomId}
                    </span>
                    <span className="text-gray-700">
                        {roomName}
                    </span>
                </div>
            </div>

            {errorMessage && (
                <div className="flex items-center gap-2 text-red-600 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle size={18} className="text-red-500" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="flex gap-3 mt-2">
                <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer shadow-sm flex-1 md:flex-none"
                >
                    確認預約 ({selectedSlots.length} 個時段)
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    取消
                </button>
            </div>
        </form>
    );
}