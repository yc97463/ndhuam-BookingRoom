"use client";

import React from "react";
import { ScheduleGridProps, DayProps } from "@/types";
import { SquareCheckBig, Square, Clock, CheckCheck } from "lucide-react";

export default function ScheduleGrid({ data, selectedSlots, onSelectSlot }: ScheduleGridProps) {
    if (!data) return <p>無可用時段</p>;

    // 確保日期數據存在
    if (!data.days || !Array.isArray(data.days) || data.days.length === 0) {
        return <p>無可用日期</p>;
    }

    // 確保時段數據存在
    if (!data.timeSlots || !Array.isArray(data.timeSlots) || data.timeSlots.length === 0) {
        return <p>無可用時段</p>;
    }

    // 確保預約數據存在
    if (!data.bookedSlots) {
        data.bookedSlots = {};
    }

    // 檢查時段是否已過期
    const isExpired = (date: string, time: string): boolean => {
        const currentTime = new Date();
        const slotTime = new Date(`${date}T${time}`);
        return slotTime < currentTime;
    };

    // 檢查時段是否在一小時內
    const isWithinOneHour = (date: string, time: string): boolean => {
        const currentTime = new Date();
        const slotTime = new Date(`${date}T${time}`);
        return slotTime < new Date(currentTime.getTime() + 60 * 60 * 1000);
    };

    // 格式化後續時段 (加一小時)
    const getNextHour = (time: string): string => {
        const hour = parseInt(time.split(':')[0], 10);
        const nextHour = (hour + 1) % 24;
        return `${nextHour.toString().padStart(2, '0')}:00`;
    };

    // 檢查時段是否已被選擇
    const isSlotSelected = (date: string, time: string): boolean => {
        return selectedSlots.some(slot => slot.date === date && slot.time === time);
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-max grid grid-cols-8 gap-1 border p-2">
                <div className="p-2 bg-blue-50 font-bold text-center sticky left-0 top-0 z-30 border-r-2 border-blue-200 border-b border-gray-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)]">時間</div>
                {data.days.map((day: DayProps) => (
                    <div key={`header-${day.date}`} className="p-2 bg-white font-bold text-center sticky top-0 z-20 border-b border-gray-200 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.1)] backdrop-blur-sm">
                        {day.dayOfWeek} <br /> {day.date}
                    </div>
                ))}

                {data.timeSlots.map((time: string) => (
                    <React.Fragment key={time}>
                        <div className="p-2 bg-blue-50 text-center cursor-default sticky left-0 z-20 border-r-2 border-blue-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)]">{time}</div>
                        {data.days.map((day: DayProps) => {
                            const isBooked = data.bookedSlots[day.date]?.includes(time);
                            const isPending = data.pendingSlots?.[day.date]?.includes(time);
                            const isReviewing = data.reviewingSlots?.[day.date]?.includes(time);
                            const expired = isExpired(day.date, time);
                            const withinOneHour = isWithinOneHour(day.date, time);
                            const selected = isSlotSelected(day.date, time);

                            let status = '';
                            let statusText = '';
                            let IconComponent: React.ComponentType<{ className?: string }> | null = null;

                            if (expired || withinOneHour) {
                                status = 'bg-gray-100 text-gray-500 border-1 border-gray-300 cursor-not-allowed';
                                statusText = '已過期';
                            } else if (isBooked) {
                                status = 'bg-red-100 text-red-700 border-1 border-gray-300 cursor-not-allowed';
                                IconComponent = CheckCheck;
                                statusText = '已預約';
                                // } else if (isPending) {
                                //     status = 'bg-orange-100 text-orange-700 border-1 border-gray-300 cursor-not-allowed';
                                //     IconComponent = Clock;
                                //     statusText = '確認中';
                            } else if (isReviewing || isPending) {
                                status = 'bg-yellow-100 text-yellow-700 border-1 border-gray-300 cursor-not-allowed';
                                IconComponent = Clock;
                                statusText = '審核中';
                            } else if (selected) {
                                status = 'bg-green-100 text-green-800 cursor-pointer border-1 border-green-500';
                                IconComponent = SquareCheckBig;
                                statusText = '已選擇';
                            } else {
                                status = 'bg-white text-gray-700 cursor-pointer hover:bg-gray-100 border-1 border-gray-300';
                                IconComponent = Square;
                                statusText = '可預約';
                            }

                            return (
                                <div
                                    key={`${day.date}-${time}`}
                                    className={`p-2 text-center flex items-center justify-center ${status}`}
                                    onClick={() => {
                                        if (!isBooked && !expired && !withinOneHour && !isPending && !isReviewing) {
                                            onSelectSlot({
                                                date: day.date,
                                                time: time,
                                                endTime: getNextHour(time)
                                            });
                                        }
                                    }}
                                >
                                    {IconComponent && <IconComponent className="w-4 h-4 inline-block mr-1" />}
                                    {statusText}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}