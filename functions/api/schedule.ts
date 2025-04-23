import { Env } from '../env';

interface ScheduleResponse {
    days: Array<{
        date: string;
        dayOfWeek: string;
    }>;
    timeSlots: string[];
    bookedSlots: Record<string, string[]>;
    pendingSlots: Record<string, string[]>;
    reviewingSlots: Record<string, string[]>;
    roomId: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const url = new URL(request.url);
        const date = url.searchParams.get('date');
        const roomId = url.searchParams.get('room');

        if (!date || !roomId) {
            return new Response('Missing date or room parameter', { status: 400 });
        }

        // 先確認教室是否存在且啟用中
        const room = await env.DB.prepare(`
            SELECT room_id FROM rooms 
            WHERE room_id = ? AND is_active = 1
        `).bind(roomId).first();

        if (!room) {
            return new Response(JSON.stringify({ error: 'Room not found or inactive' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 生成一週的日期
        const startDate = new Date(date);
        const days = [];
        const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

        // 調整到週一
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            days.push({
                date: currentDate.toISOString().split('T')[0],
                dayOfWeek: dayNames[currentDate.getDay()]
            });
        }

        // 生成時段列表 (6:00-21:00)
        const timeSlots = Array.from({ length: 16 }, (_, i) =>
            `${String(i + 6).padStart(2, '0')}:00`
        );

        // 查詢預約狀態
        const { results } = await env.DB.prepare(`
            SELECT 
                date,
                start_time,
                status
            FROM requested_slots
            WHERE room_id = ?
            AND date >= ?
            AND date <= ?
        `).bind(
            roomId,
            days[0].date,
            days[6].date
        ).all();

        // 整理各狀態的時段
        const bookedSlots: Record<string, string[]> = {};
        const pendingSlots: Record<string, string[]> = {};
        const reviewingSlots: Record<string, string[]> = {};

        results.forEach((row: any) => {
            const date = row.date;
            const timeSlot = row.start_time;

            if (!bookedSlots[date]) bookedSlots[date] = [];
            if (!pendingSlots[date]) pendingSlots[date] = [];
            if (!reviewingSlots[date]) reviewingSlots[date] = [];

            switch (row.status) {
                case 'confirmed':
                    bookedSlots[date].push(timeSlot);
                    break;
                case 'pending':
                    pendingSlots[date].push(timeSlot);
                    break;
                case 'reviewing':
                    reviewingSlots[date].push(timeSlot);
                    break;
            }
        });

        const response: ScheduleResponse = {
            days,
            timeSlots,
            bookedSlots,
            pendingSlots,
            reviewingSlots,
            roomId
        };

        return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('GET /api/schedule error:', err);
        return new Response('Internal Server Error', { status: 500 });
    }
};
