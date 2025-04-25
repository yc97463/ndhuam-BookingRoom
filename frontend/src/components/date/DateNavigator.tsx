"use client";

// DateNavigator.tsx
import React from 'react';
import DateSelector from './DateSelector';
import { DateNavigatorProps } from '@/types';

const DateNavigator = ({ selectedDate, onChange, onAdjust }: DateNavigatorProps) => {
    return (
        <div className="flex items-center gap-2">
            {/* <label className="font-semibold">選擇日期：</label> */}
            <button
                className="border border-gray-300 px-3 py-2 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => onAdjust(-7)}
            >
                -7
            </button>
            <DateSelector selectedDate={selectedDate} onChange={onChange} />
            <button
                className="border border-gray-300 px-3 py-2 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => onAdjust(7)}
            >
                +7
            </button>
        </div>
    );
};

export default DateNavigator;