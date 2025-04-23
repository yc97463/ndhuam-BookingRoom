export interface Room {
    tempId?: string; // For new rooms before saving
    roomId: string;
    roomName: string;
    location: string;
    capacity: number;
    order: number;
    isActive: boolean;
}
