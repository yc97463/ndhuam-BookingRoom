// SystemHeader.tsx
import React from 'react';
import RoomSelector from '../RoomSelector';
import DateNavigator from '../date/DateNavigator';
import { SystemHeaderProps } from '@/types';
import { Bolt, Building2, CalendarDays, RefreshCcw } from 'lucide-react';

const SystemHeader = ({
    rooms,
    selectedRoom,
    selectedDate,
    roomsError,
    onRoomSelect,
    onDateChange,
    onDateAdjust,
    onRefresh,
    isRefreshing
}: SystemHeaderProps) => {
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm mb-6 overflow-hidden">
            {/* Header with gradient */}
            <div className="py-5 px-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-sm">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">空間預約系統</h1>
                        <p className="text-sm text-gray-500">應用數學系</p>
                    </div>
                </div>
            </div>

            {/* Form controls */}
            <div className="p-5">
                {roomsError ? (
                    <div className="flex items-center justify-start px-4 py-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
                        <span className="text-sm">無法載入空間資訊</span>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                <Building2 size={14} className="text-gray-400" />
                                選擇空間
                            </label>
                            <RoomSelector
                                rooms={rooms || []}
                                selectedRoom={selectedRoom}
                                onSelect={onRoomSelect}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                <CalendarDays size={14} className="text-gray-400" />
                                選擇日期
                            </label>
                            <DateNavigator
                                selectedDate={selectedDate}
                                onChange={onDateChange}
                                onAdjust={onDateAdjust}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                <Bolt size={14} className="text-gray-400" />
                                操作
                            </label>
                            <button
                                onClick={() => onRefresh()}
                                disabled={isRefreshing}
                                className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 transition-colors cursor-pointer"
                            >
                                {isRefreshing ? (
                                    <>
                                        <RefreshCcw size={14} className="animate-spin" />
                                        <span className="text-sm">更新中...</span>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCcw size={14} />
                                        <span className="text-sm">重新整理</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemHeader;