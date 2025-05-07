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

            // 準備所有要執行的 SQL 語句
            const operations = [];

            // 更新申請狀態
            operations.push(
                env.DB.prepare(`
                    UPDATE applications 
                    SET status = ?, 
                        review_note = ?,
                        reviewed_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `).bind(applicationStatus, note || '', applicationId)
            );

            // 更新個別時段狀態
            for (const slot of slots) {
                operations.push(
                    env.DB.prepare(`
                        UPDATE requested_slots
                        SET status = ?
                        WHERE id = ?
                    `).bind(slot.status, slot.slotId)
                );

                // 如果是確認的時段，準備插入到 booked_slots
                if (slot.status === 'confirmed') {
                    operations.push(
                        env.DB.prepare(`
                            INSERT INTO booked_slots (
                                application_id,
                                room_id,
                                date,
                                start_time,
                                end_time
                            )
                            SELECT ?, room_id, date, start_time, end_time
                            FROM requested_slots
                            WHERE id = ?
                        `).bind(applicationId, slot.slotId)
                    );
                }
            }

            // 執行所有操作
            await env.DB.batch(operations);

            return new Response(JSON.stringify({
                success: true,
                message: '已更新申請狀態'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
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
