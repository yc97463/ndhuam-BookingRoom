import { Env } from '../../env';
import { verify } from '@tsndr/cloudflare-worker-jwt';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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

        interface ReviewRequestBody {
            applicationId: number;
            status: 'confirmed' | 'rejected';
            note?: string;
        }

        const { applicationId, status, note } = await request.json() as ReviewRequestBody;

        if (!applicationId || !status || !['confirmed', 'rejected'].includes(status)) {
            return new Response(JSON.stringify({ error: 'Invalid request' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 狀態映射
        const dbStatus = status === 'confirmed' ? 'confirmed' : 'rejected';

        try {
            // 使用 D1 的事務 API
            const success = await env.DB.prepare(`
                UPDATE applications 
                SET status = ?, 
                    review_note = ?,
                    reviewed_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `).bind(dbStatus, note || '', applicationId)
                .run()
                .then(async () => {
                    // 更新相關的時段狀態
                    return await env.DB.prepare(`
                      UPDATE requested_slots
                      SET status = ?
                      WHERE application_id = ?
                  `).bind(dbStatus, applicationId).run();
                });

            return new Response(JSON.stringify({
                success: true,
                message: status === 'confirmed' ? '已核准申請' : '已拒絕申請'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            throw err;
        }
    } catch (err) {
        console.error('Error in /admin/review:', err);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            details: err.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
