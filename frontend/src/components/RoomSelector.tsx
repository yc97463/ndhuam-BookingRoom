"use client";

import { RoomSelectorProps } from "@/types";

export default function RoomSelector({ rooms, selectedRoom, onSelect }: RoomSelectorProps) {
    return (
        <div className="flex items-center gap-2">
            <label className="font-semibold hidden">選擇教室：</label>
            <select
                value={selectedRoom}
                onChange={(e) => onSelect(e.target.value)}
                className="border p-2 rounded w-40"
            >
                {rooms.map((room) => (
                    <option key={room.roomId} value={room.roomId}>
                        {room.roomName}
                    </option>
                ))}
            </select>
        </div>
    );
}
