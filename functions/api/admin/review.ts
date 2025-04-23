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

        interface SlotReview {
            slotId: number;
            status: 'confirmed' | 'rejected';
        }

        interface ReviewRequestBody {
            applicationId: number;
            slots: SlotReview[];
            note?: string;
        }

        const { applicationId, slots, note } = await request.json() as ReviewRequestBody;

        if (!applicationId || !slots || !Array.isArray(slots)) {
            return new Response(JSON.stringify({ error: 'Invalid request' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            // Update application status based on slots
            const hasConfirmed = slots.some(slot => slot.status === 'confirmed');
            const applicationStatus = hasConfirmed ? 'confirmed' : 'rejected';

            await env.DB.prepare(`
                UPDATE applications 
                SET status = ?, 
                    review_note = ?,
                    reviewed_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `).bind(applicationStatus, note || '', applicationId).run();

            // Update individual slots
            for (const slot of slots) {
                await env.DB.prepare(`
                    UPDATE requested_slots
                    SET status = ?
                    WHERE id = ?
                `).bind(slot.status, slot.slotId).run();
            }

            return new Response(JSON.stringify({
                success: true,
                message: '已更新申請狀態'
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
