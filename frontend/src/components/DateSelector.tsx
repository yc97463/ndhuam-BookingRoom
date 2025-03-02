"use client";

import React from "react";
import { DateSelectorProps } from "@/types";

export default function DateSelector({ selectedDate, onChange }: DateSelectorProps) {
    // 設定最小日期為今天
    const today = new Date().toISOString().split("T")[0];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        console.log(`DateSelector: Date changed from ${selectedDate} to ${newDate}`);
        onChange(newDate);
    };

    return (
        <input
            type="date"
            value={selectedDate}
            min={today}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-40 hover:bg-gray-50 cursor-pointer"
        />
    );
}