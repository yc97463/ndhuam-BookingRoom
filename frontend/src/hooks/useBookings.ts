import useSWR from "swr";
import { Room, ScheduleGridProps } from "@/types";

const API_URL = "/api/proxy";
// const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbym16hK6fuVWNBiglZEciya4ZVpa3xNKiBDv4Bh07fulMF9sPQU7ch00vKxLNDKWX_9/exec"; // 替換為你的 API

// 通用 fetcher 函數
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// 取得教室清單
export function useRooms() {
    const { data, error, isLoading } = useSWR(`${API_URL}/?action=getRooms`, fetcher);
    return {
        rooms: data as Room[] | undefined,
        isLoading,
        error,
    };
}

// 取得時段
export function useTimeSlots(selectedDate: string, selectedRoom: string) {
    const { data, error, isLoading, mutate } = useSWR(
        selectedRoom ? `${GOOGLE_SCRIPT_URL}/getTimeSlots?date=${selectedDate}&room=${selectedRoom}` : null,
        fetcher
    );
    return {
        scheduleData: data as ScheduleGridProps["data"] | undefined,
        isLoading,
        error,
        mutate, // 允許手動重新驗證 (例如提交預約後)
    };
}
