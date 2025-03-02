"use client";

// SelectedSlots.tsx
import React from 'react';
import { SelectedSlotsProps } from '@/types';

const SelectedSlots = ({ slots, onRemoveSlot, onClearAll, onProceed }: SelectedSlotsProps) => {
    if (slots.length === 0) return null;

    return (
        <div className="mt-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-blue-700">已選擇 {slots.length} 個時段</h3>
            <div className="flex flex-wrap gap-2 mt-2">
                {slots.map((slot, index) => (
                    <div
                        key={`${slot.date}-${slot.time}`}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                        <span>{slot.date} {slot.time}-{slot.endTime}</span>
                        <button
                            className="ml-2 text-blue-600 hover:text-blue-800 cursor-pointer"
                            onClick={() => onRemoveSlot(index)}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
            {/* <div className="mt-3 flex justify-end">
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors cursor-pointer"
                    onClick={onProceed}
                >
                    預約所選時段
                </button>
                <button
                    className="ml-2 border border-gray-300 px-4 py-2 rounded text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={onClearAll}
                >
                    清除選擇
                </button>
            </div> */}
        </div>
    );
};

export default SelectedSlots;