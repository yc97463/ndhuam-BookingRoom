// SystemHeader.tsx
import React from 'react';
import RoomSelector from '../RoomSelector';
import DateNavigator from '../date/DateNavigator';
import RefreshButton from '../RefreshButton';
import { SystemHeaderProps } from '@/types';
import { Building2 } from 'lucide-react';

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-sm">
                    <Building2 size={20} />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-gray-900">空間預約系統</h1>
                    <p className="text-sm text-gray-500">應用數學系</p>
                </div>
            </div>

            {roomsError ? (
                <div className="flex items-center px-4 py-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
                    <span className="text-sm">無法載入空間資訊</span>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div>

                        <div className="flex-1 items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">空間</label>
                            <div className="w-full md:w-auto">
                                <RoomSelector
                                    rooms={rooms || []}
                                    selectedRoom={selectedRoom}
                                    onSelect={onRoomSelect}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex-1 items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">日期</label>
                            <div className="w-full md:w-auto">
                                <DateNavigator
                                    selectedDate={selectedDate}
                                    onChange={onDateChange}
                                    onAdjust={onDateAdjust}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex-1 items-center">
                            <label className="text-sm font-medium text-gray-700">時間表操作</label>
                            <div className="w-full md:w-auto">
                                <RefreshButton
                                    onRefresh={onRefresh}
                                    isLoading={isRefreshing}
                                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-colors cursor-pointer shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemHeader;