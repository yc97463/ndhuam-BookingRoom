"use client";

import { ScheduleGridProps, DayProps } from "@/types";

export default function ScheduleGrid({ data, onSelectSlot }: ScheduleGridProps) {
    if (!data) return <p>無可用時段</p>;

    return (
        <div className="grid grid-cols-8 gap-2 border p-2">
            <div className="font-bold text-center">時間</div>
            {data.days.map((day: DayProps) => (
                <div key={day.date} className="font-bold text-center">
                    {day.dayOfWeek} <br /> {day.date}
                </div>
            ))}

            {data.timeSlots.map((time: string) => (
                <div key={time} className="border p-2 text-center">{time}</div>
            ))}

            {data.days.map((day: DayProps) =>
                data.timeSlots.map((time: string) => {
                    const isBooked = data.bookedSlots[day.date]?.includes(time);
                    return (
                        <div
                            key={`${day.date}-${time}`}
                            className={`p-2 text-center cursor-pointer ${isBooked ? "bg-red-200" : "bg-green-200"}`}
                            onClick={() => !isBooked && onSelectSlot({ date: day.date, time })}
                        >
                            {isBooked ? "已預約" : "可預約"}
                        </div>
                    );
                })
            )}
        </div>
    );
}
