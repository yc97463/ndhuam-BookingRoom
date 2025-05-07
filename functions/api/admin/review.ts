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

            // 發送審核結果通知郵件
            const GAS_EMAIL_API_URL = env.GAS_EMAIL_API_URL;
            try {
                // 取得申請者資訊
                const { results: [application] } = await env.DB.prepare(`
                    SELECT name, email, purpose, room_id
                    FROM applications 
                    WHERE id = ?
                `).bind(applicationId).all();

                if (application) {
                    // 取得申請的時段資訊
                    const { results: slots } = await env.DB.prepare(`
                        SELECT date, start_time, end_time, status
                        FROM requested_slots
                        WHERE application_id = ?
                    `).bind(applicationId).all();

                    // 分類並格式化時段資訊
                    const approvedSlots = slots
                        .filter(slot => slot.status === 'confirmed')
                        .map(slot => `✓ ${slot.date} ${slot.start_time}-${slot.end_time}<br />`)
                        .join('\n');

                    const rejectedSlots = slots
                        .filter(slot => slot.status === 'rejected')
                        .map(slot => `✗ ${slot.date} ${slot.start_time}-${slot.end_time}<br />`)
                        .join('\n');

                    // 準備下一步指示
                    const nextSteps = applicationStatus === 'confirmed'
                        ? `您的申請已獲核准，請<a href="${env.APP_URL}">查看預約官網</a>確認借用流程，並於上班時間領取鑰匙🔑。`
                        : '您的申請未獲核准，如有疑問請聯繫系辦。';

                    const emailResponse = await fetch(GAS_EMAIL_API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            templateKey: 'REVIEW_RESULT',
                            to: application.email,
                            templateData: {
                                applicantName: application.name,
                                applicationId: applicationId.toString(),
                                applicationSpace: application.room_id,
                                reviewStatus: applicationStatus === 'confirmed' ? '已核准' : '已駁回',
                                reviewComment: note || '無',
                                approvedSlots: approvedSlots || '無核准時段',
                                rejectedSlots: rejectedSlots || '無駁回時段',
                                nextSteps: nextSteps,
                                contactInfo: '系辦電話：03-890-3111\nEmail：am@ndhu.edu.tw'
                            }
                        })
                    });

                    const emailResult = await emailResponse.json() as { success: boolean; message?: string; error?: string };
                    if (!emailResult.success) {
                        console.error('Failed to send review result email:', emailResult.message || 'Unknown error');
                    }
                }
            } catch (emailError) {
                console.error('Email sending error:', emailError);
                // 不中斷流程，繼續回傳成功訊息
            }

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
