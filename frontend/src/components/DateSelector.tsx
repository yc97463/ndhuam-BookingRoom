"use client";

import { DateSelectorProps } from "@/types";

export default function DateSelector({ selectedDate, onChange }: DateSelectorProps) {
    return (
        <div className="flex items-center gap-2">
            <label className="font-semibold">選擇日期：</label>
            <input
                type="date"
                value={selectedDate}
                onChange={(e) => onChange(e.target.value)}
                className="border p-2 rounded"
            />
        </div>
    );
}
