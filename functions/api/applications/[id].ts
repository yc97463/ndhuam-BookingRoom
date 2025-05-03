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
        const { results: slots } = await env.DB.prepare(
            `SELECT * FROM requested_slots WHERE application_id = ?`
        ).bind(id).all();

        return new Response(JSON.stringify({
            ...app,
            requested_slots: slots
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