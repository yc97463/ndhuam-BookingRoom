export interface Room {
    roomId: string;
    roomName: string;
}

export interface DayProps {
    date: string;
    dayOfWeek: string;
}


export interface BookingDataProps {
    action: string;
    isMultipleBooking?: boolean;
    name: string;
    email: string;
    organization: string;
    phone: string;
    date: string;
    timeSlot: string;
    roomId: string;
    purpose: string;
    turnstileToken?: string;
    multipleSlots: Array<{
        date: string;
        time: string;
        endTime?: string;
        name: string;
        email: string;
        phone: string;
        roomId: string;
        purpose: string;
        action: string;
    }>;
}

export interface BookingFormProps {
    selectedSlots: Array<{
        date: string;
        time: string;
        endTime?: string;
    }>;
    selectedDate: string;
    selectedRoom: string;
    roomId?: string;
    roomName?: string;
    onClose: () => void;
    onSubmit: (data: BookingDataProps) => void;
}

export interface ScheduleGridProps {
    data?: {
        days: DayProps[];
        timeSlots: string[];
        bookedSlots: { [date: string]: string[] };
        pendingSlots?: { [date: string]: string[] };
        reviewingSlots?: { [date: string]: string[] };
    };
    selectedSlots: Array<{ date: string; time: string; endTime?: string }>;
    onSelectSlot: (slot: { date: string; time: string; endTime?: string }) => void;
}


export interface LoadingMaskProps {
    loading: boolean;
}

export interface RoomSelectorProps {
    rooms: Room[];
    selectedRoom: string;
    onSelect: (roomId: string) => void;
    onClearSlots: () => void;
}

export interface DateSelectorProps {
    selectedDate: string;
    onChange: (date: string) => void;
}

export interface DateNavigatorProps {
    selectedDate: string;
    onChange: (date: string) => void;
    onAdjust: (days: number) => void;
}

export interface RefreshButtonProps {
    onRefresh: () => void;
    isLoading?: boolean;
    className?: string;
}

export interface SelectedSlotsProps {
    slots: Array<{ date: string; time: string; endTime?: string }>;
    onRemoveSlot: (index: number) => void;
    onClearAll: () => void;
    onProceed: () => void;
}

export interface SystemHeaderProps {
    rooms: Room[];
    selectedRoom: string;
    selectedDate: string;
    roomsError: boolean;
    onRoomSelect: (roomId: string) => void;
    onDateChange: (date: string) => void;
    onDateAdjust: (days: number) => void;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export interface BookingSystemProps {
    time: string;
    date: string;

}