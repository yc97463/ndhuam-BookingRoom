import { Env } from '../env';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
    try {
        // 查詢所有教室
        const { results } = await env.DB.prepare(
            "SELECT room_id, room_name FROM rooms ORDER BY room_id"
        ).all();

        // 格式化回應
        const rooms = results.map(room => ({
            roomId: room.room_id,
            roomName: `${room.room_id} ${room.room_name}`
        }));

        return new Response(JSON.stringify(rooms), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("GET /api/rooms error:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
};
