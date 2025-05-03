"use client";

import React from "react";
import { RoomSelectorProps } from "@/types";

export default function RoomSelector({ rooms, selectedRoom, onSelect, onClearSlots }: RoomSelectorProps) {
    const handleRoomChange = (roomId: string) => {
        if (roomId === selectedRoom) return;

        // 如果切換到不同的教室，顯示確認對話框
        if (window.confirm('切換教室將會清除已選擇的時段，是否繼續？')) {
            onClearSlots();
            onSelect(roomId);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <label className="font-semibold hidden">選擇教室：</label>
            <select
                value={selectedRoom}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="border p-2 rounded"
            >
                {rooms.map((room) => (
                    <option key={room.roomId} value={room.roomId}>
                        {room.roomId} {room.roomName}
                    </option>
                ))}
            </select>
        </div>
    );
}
