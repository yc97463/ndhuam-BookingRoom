"use client";

import { useState, useEffect } from 'react';
import { Loader2, GripVertical, Plus, Trash2, Save } from 'lucide-react';
import type { Room } from '@/types/room';

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [nextTempId, setNextTempId] = useState(1);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/admin/rooms', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch rooms');
            const data = await response.json();
            setRooms(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const addRoom = () => {
        const tempId = `TEMP-${nextTempId}`;
        setNextTempId(prev => prev + 1);

        const newRoom: Room = {
            tempId,
            roomId: '',
            roomName: '',
            location: '',
            capacity: 0,
            order: rooms.length,
            isActive: true
        };
        setRooms([...rooms, newRoom]);
    };

    const updateRoom = (index: number, updates: Partial<Room>) => {
        const newRooms = [...rooms];
        newRooms[index] = { ...newRooms[index], ...updates };
        setRooms(newRooms);
    };

    const removeRoom = (index: number) => {
        setRooms(rooms.filter((_, i) => i !== index));
    };

    // const moveRoom = (fromIndex: number, toIndex: number) => {
    //     const newRooms = [...rooms];
    //     const [movedRoom] = newRooms.splice(fromIndex, 1);
    //     newRooms.splice(toIndex, 0, movedRoom);
    //     // Update order values
    //     newRooms.forEach((room, index) => {
    //         room.order = index;
    //     });
    //     setRooms(newRooms);
    // };

    const saveRooms = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/rooms', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rooms })
            });
            if (!response.ok) throw new Error('Failed to save rooms');
            await fetchRooms(); // Refresh data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">空間管理</h1>
                <button
                    onClick={saveRooms}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-500 text-white rounded-full flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            儲存中...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            儲存變更
                        </>
                    )}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 space-y-4">
                    {rooms.map((room, index) => (
                        <div
                            key={room.tempId || room.roomId}
                            className="flex flex-col gap-4 p-4 bg-gray-50 rounded"
                        >
                            <div className="flex items-center gap-4">
                                <button className="text-gray-400 hover:text-gray-600 cursor-move">
                                    <GripVertical size={20} />
                                </button>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={room.roomId}
                                        onChange={(e) => updateRoom(index, { roomId: e.target.value })}
                                        placeholder="空間代碼 (如: A205)"
                                        className="px-2 py-1 border rounded"
                                    />
                                    <input
                                        type="text"
                                        value={room.roomName}
                                        onChange={(e) => updateRoom(index, { roomName: e.target.value })}
                                        placeholder="空間名稱 (如: 電腦教室)"
                                        className="px-2 py-1 border rounded"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pl-10">
                                <input
                                    type="text"
                                    value={room.location}
                                    onChange={(e) => updateRoom(index, { location: e.target.value })}
                                    placeholder="位置描述 (如: 理工大樓2樓)"
                                    className="flex-1 px-2 py-1 border rounded"
                                />
                                <input
                                    type="number"
                                    value={room.capacity}
                                    onChange={(e) => updateRoom(index, { capacity: parseInt(e.target.value) || 0 })}
                                    placeholder="容納人數"
                                    min="0"
                                    className="w-24 px-2 py-1 border rounded"
                                />
                                <button
                                    onClick={() => updateRoom(index, { isActive: !room.isActive })}
                                    className={`px-3 py-1 rounded text-sm min-w-[4rem] cursor-pointer ${room.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    {room.isActive ? '啟用中' : '停用'}
                                </button>
                                <button
                                    onClick={() => removeRoom(index)}
                                    className="text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t">
                    <button
                        onClick={addRoom}
                        className="w-full py-2 text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Plus size={20} />
                        新增空間
                    </button>
                </div>
            </div>
        </div>
    );
}