"use client";

import { useState, useEffect } from 'react';
import { Loader2, GripVertical, Plus, Trash2, Save, Settings as SettingsIcon, Building } from 'lucide-react';
import type { Room } from '@/types/room';
import { useRouter } from 'next/navigation';
import { fetchWithAuth, handleApiResponse } from '@/utils/handleApiResponse';

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [nextTempId, setNextTempId] = useState(1);
    const router = useRouter();

    const fetchRooms = async () => {
        try {
            const response = await fetchWithAuth('/api/admin/rooms');
            const data = await handleApiResponse(response, router);
            setRooms(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

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
            const response = await fetchWithAuth('/api/admin/rooms', {
                method: 'POST',
                body: JSON.stringify({ rooms })
            });

            await handleApiResponse(response, router);
            await fetchRooms();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            {/* Header Section */}
            <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-sm">
                            <SettingsIcon size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">空間管理</h1>
                            <p className="text-gray-500 text-sm">管理系統可預約的空間設定</p>
                        </div>
                    </div>
                    <button
                        onClick={saveRooms}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50 shadow-sm transition-colors cursor-pointer"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                <span>儲存中...</span>
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                <span>儲存變更</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <Loader2 className="animate-spin text-blue-500" size={30} />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 space-y-4">
                        {rooms.length === 0 ? (
                            <div className="text-center py-10">
                                <Building size={40} className="text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">目前尚未設定任何空間</p>
                                <button
                                    onClick={addRoom}
                                    className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-100 transition-colors mx-auto"
                                >
                                    <Plus size={16} />
                                    <span>新增第一個空間</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                {rooms.map((room, index) => (
                                    <div
                                        key={room.tempId || room.roomId}
                                        className="bg-white border border-gray-200 rounded-lg p-4 transition-all hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <button className="text-gray-400 hover:text-gray-600 cursor-move p-1">
                                                <GripVertical size={18} />
                                            </button>
                                            <div className="flex-1 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">空間編號</label>
                                                    <input
                                                        type="text"
                                                        value={room.roomId}
                                                        onChange={(e) => updateRoom(index, { roomId: e.target.value })}
                                                        placeholder="如: A205"
                                                        className="px-3 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">空間名稱</label>
                                                    <input
                                                        type="text"
                                                        value={room.roomName}
                                                        onChange={(e) => updateRoom(index, { roomName: e.target.value })}
                                                        placeholder="如: 電腦教室"
                                                        className="px-3 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ml-9 flex flex-wrap gap-4">
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">所在位置</label>
                                                <input
                                                    type="text"
                                                    value={room.location}
                                                    onChange={(e) => updateRoom(index, { location: e.target.value })}
                                                    placeholder="如: 理工大樓2樓"
                                                    className="px-3 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                            <div className="w-28">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">容納人數</label>
                                                <input
                                                    type="number"
                                                    value={room.capacity}
                                                    onChange={(e) => updateRoom(index, { capacity: parseInt(e.target.value) || 0 })}
                                                    placeholder="人數"
                                                    min="0"
                                                    className="px-3 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <button
                                                    onClick={() => updateRoom(index, { isActive: !room.isActive })}
                                                    className={`h-[42px] px-3 py-2 rounded-lg text-sm min-w-[5rem] font-medium transition-colors cursor-pointer ${room.isActive
                                                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {room.isActive ? '啟用中' : '已停用'}
                                                </button>
                                                <button
                                                    onClick={() => removeRoom(index)}
                                                    className="h-[42px] px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {rooms.length > 0 && (
                        <div className="p-4 border-t border-gray-100">
                            <button
                                onClick={addRoom}
                                className="w-full py-3 text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                            >
                                <Plus size={18} />
                                <span>新增空間</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}