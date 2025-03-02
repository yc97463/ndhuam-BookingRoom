"use client";

import React from "react";
import { ScheduleGridProps, DayProps } from "@/types";

export default function ScheduleGrid({ data, onSelectSlot }: ScheduleGridProps) {
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

    return (
        <div className="overflow-x-auto">
            <div className="min-w-max grid grid-cols-8 gap-1 border p-2">
                <div className="p-2 bg-gray-100 font-bold text-center">時間</div>
                {data.days.map((day: DayProps) => (
                    <div key={`header-${day.date}`} className="p-2 bg-gray-100 font-bold text-center">
                        {day.dayOfWeek} <br /> {day.date}
                    </div>
                ))}

                {data.timeSlots.map((time: string) => (
                    <React.Fragment key={time}>
                        <div className="p-2 border text-center">{time}</div>
                        {data.days.map((day: DayProps) => {
                            const isBooked = data.bookedSlots[day.date]?.includes(time);
                            const isPending = data.pendingSlots?.[day.date]?.includes(time);
                            const expired = isExpired(day.date, time);
                            const withinOneHour = isWithinOneHour(day.date, time);

                            let status = '';
                            let statusText = '';

                            if (expired || withinOneHour) {
                                status = 'bg-gray-200 text-gray-500';
                                statusText = '已過期';
                            } else if (isBooked) {
                                status = 'bg-red-200 text-red-800';
                                statusText = '已預約';
                            } else if (isPending) {
                                status = 'bg-orange-100 text-orange-700';
                                statusText = '確認中';
                            } else {
                                status = 'bg-green-200 text-green-800 cursor-pointer hover:bg-green-300';
                                statusText = '可預約';
                            }

                            return (
                                <div
                                    key={`${day.date}-${time}`}
                                    className={`p-2 text-center ${status}`}
                                    onClick={() => {
                                        if (!isBooked && !expired && !withinOneHour && !isPending) {
                                            onSelectSlot({
                                                date: day.date,
                                                time: time,
                                                endTime: getNextHour(time)
                                            });
                                        }
                                    }}
                                >
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