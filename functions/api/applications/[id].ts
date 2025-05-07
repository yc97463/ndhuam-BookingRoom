import { Env } from "../../env";
import { verify } from '@tsndr/cloudflare-worker-jwt';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.split(' ')[1];
        const isValid = await verify(token, env.JWT_SECRET);
        if (!isValid) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const id = params?.id;
        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing id param' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 查詢 application
        const { results: apps } = await env.DB.prepare(
            `SELECT * FROM applications WHERE id = ?`
        ).bind(id).all();

        if (apps.length === 0) {
            return new Response(JSON.stringify({ error: 'Application not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const app = apps[0];

        // 查詢 slots
        const { results: requestedSlots } = await env.DB.prepare(
            `SELECT * FROM requested_slots WHERE application_id = ?`
        ).bind(id).all();

        // 查詢已確認的時段
        const { results: bookedSlots } = await env.DB.prepare(
            `SELECT * FROM booked_slots WHERE application_id = ?`
        ).bind(id).all();

        // 合併時段資訊
        const allSlots = [
            ...requestedSlots,
            ...bookedSlots.map(slot => ({
                ...slot,
                status: 'confirmed' // 已確認的時段狀態固定為 confirmed
            }))
        ];

        return new Response(JSON.stringify({
            ...app,
            requested_slots: allSlots
        }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("GET /api/applications/[id] error:", err);
        return new Response(JSON.stringify({
            error: err.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};