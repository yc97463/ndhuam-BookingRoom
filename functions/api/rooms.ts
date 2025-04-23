import { Env } from '../env';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
    try {
        // 查詢所有教室 (只查詢啟用中的)
        const { results } = await env.DB.prepare(`
            SELECT 
                room_id,
                room_name,
                location,
                capacity,
                "order",
                is_active
            FROM rooms 
            WHERE is_active = 1
            ORDER BY "order" ASC, room_id ASC
        `).all();

        // 格式化回應
        const rooms = results.map(room => ({
            roomId: room.room_id,
            roomName: room.room_name,
            displayName: `${room.room_id} ${room.room_name}`,
            location: room.location,
            capacity: room.capacity
        }));

        return new Response(JSON.stringify(rooms), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("GET /api/rooms error:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
};
