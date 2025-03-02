// SystemHeader.tsx
import React from 'react';
import RoomSelector from './RoomSelector';
import DateNavigator from './date/DateNavigator';
import RefreshButton from './RefreshButton';
import { SystemHeaderProps } from '@/types';

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
        <>
            <h1 className="text-2xl font-bold mb-4">應數系空間預約系統</h1>

            <div className="flex flex-wrap gap-4 mb-4 items-center">
                {roomsError ? (
                    <p className="text-red-500">無法載入教室</p>
                ) : (
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <div className="flex items-center gap-2">
                            <label className="font-semibold">選擇教室：</label>
                            <RoomSelector
                                rooms={rooms || []}
                                selectedRoom={selectedRoom}
                                onSelect={onRoomSelect}
                            />
                        </div>

                        <DateNavigator
                            selectedDate={selectedDate}
                            onChange={onDateChange}
                            onAdjust={onDateAdjust}
                        />

                        <div className="flex items-center">
                            <RefreshButton onRefresh={onRefresh} isLoading={isRefreshing} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default SystemHeader;