"use client";

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { SelectedSlotsProps } from '@/types';

const SelectedSlots = ({ slots, onRemoveSlot, onClearAll, onProceed }: SelectedSlotsProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (slots.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
            <div className={`container mx-auto transition-all duration-300 ease-in-out ${isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-64px)]'}`}>
                {/* Header - Always visible */}
                <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-blue-700">已選擇 {slots.length} 個時段</h3>
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClearAll();
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            清除
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onProceed();
                            }}
                            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        >
                            下一步
                        </button>
                    </div>
                </div>

                {/* Expandable Content */}
                <div className={`px-4 pb-4 space-y-2 ${isExpanded ? 'block' : 'hidden'}`}>
                    <div className="flex flex-wrap gap-2">
                        {slots.map((slot, index) => (
                            <div
                                key={`${slot.date}-${slot.time}`}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                            >
                                <span>{slot.date} {slot.time}-{slot.endTime}</span>
                                <button
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveSlot(index);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectedSlots;