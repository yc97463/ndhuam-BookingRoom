export interface Room {
    roomId: string;
    roomName: string;
}

export interface DayProps {
    date: string;
    dayOfWeek: string;
}

export interface BookingDataProps {
    name: string;
    email: string;
    phone: string;
    date: string;
    timeSlot: string;
    roomId: string;
    purpose: string;
}

export interface BookingFormProps {
    selectedSlot: { time: string };
    selectedDate: string;
    selectedRoom: string;
    onClose: () => void;
    onSubmit: (data: BookingDataProps) => void;
}

export interface ScheduleGridProps {
    data: {
        days: DayProps[];
        timeSlots: string[];
        bookedSlots: { [date: string]: string[] };
    };
    onSelectSlot: (slot: { date: string; time: string }) => void;
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
