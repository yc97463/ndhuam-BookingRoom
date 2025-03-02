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
    phone: string;
    date: string;
    timeSlot: string;
    roomId: string;
    purpose: string;
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
}

export interface DateSelectorProps {
    selectedDate: string;
    onChange: (date: string) => void;
}