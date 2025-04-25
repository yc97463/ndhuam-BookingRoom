"use client";

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, X, Calendar, Clock } from 'lucide-react';
import { SelectedSlotsProps } from '@/types';

const SelectedSlots = ({ slots, onRemoveSlot, onClearAll, onProceed }: SelectedSlotsProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (slots.length === 0) return null;

    // Group and sort slots by date (nearest first)
    const groupedSlots = slots.reduce((acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
    }, {} as Record<string, typeof slots>);

    // Sort dates from nearest to furthest
    const sortedDates = Object.keys(groupedSlots).sort((a, b) =>
        new Date(a).getTime() - new Date(b).getTime()
    );

    // Sort slots within each date by time (earliest first)
    Object.values(groupedSlots).forEach(dateSlots => {
        dateSlots.sort((a, b) =>
            a.time.localeCompare(b.time)
        );
    });

    return (
        <div className="fixed bottom-0 left-0 right-0 z-30">
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-white/80 backdrop-blur-md"></div>

            <div
                className={`container mx-auto transition-all duration-300 ease-in-out relative 
                    ${isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-64px)]'}`}
            >
                <div className="mx-4 mb-4 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                    {/* Header - Always visible */}
                    <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-lg shadow-sm">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-gray-800">已選擇 {slots.length} 個時段</h3>
                                    <div className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                        {slots.length}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">按這裡展開或收合時段列表</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClearAll();
                                }}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                清除全部
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onProceed();
                                }}
                                className="px-5 py-1.5 bg-blue-500 text-sm text-white rounded-lg hover:bg-blue-600 shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer"
                            >
                                下一步
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center text-blue-500 rounded-full hover:bg-blue-50 transition-colors">
                                {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                            </div>
                        </div>
                    </div>

                    {/* Expandable Content using Tailwind's dvh (dynamic viewport height) */}
                    <div
                        className={`px-4 pb-4 ${isExpanded ? 'block' : 'hidden'} overflow-y-auto max-h-[50dvh]`}
                    >
                        <div className="pt-2 border-t border-gray-100">
                            {/* Group slots by date and sort them */}
                            {sortedDates.map(date => (
                                <div key={date} className="mb-3">
                                    <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white py-2 z-10">
                                        <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-md">
                                            <Calendar size={14} />
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-700">
                                            {date} 星期{['日', '一', '二', '三', '四', '五', '六'][new Date(date).getDay()]}
                                        </h4>
                                    </div>
                                    <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {groupedSlots[date].map(slot => {
                                            const slotIndex = slots.findIndex(
                                                s => s.date === slot.date && s.time === slot.time
                                            );
                                            return (
                                                <div
                                                    key={`${slot.date}-${slot.time}`}
                                                    className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg group transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-gray-400" />
                                                        <span className="text-sm text-gray-700">{slot.time}-{slot.endTime}</span>
                                                    </div>
                                                    <button
                                                        className="opacity-60 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemoveSlot(slotIndex);
                                                        }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectedSlots;