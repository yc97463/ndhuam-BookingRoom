// functions/api/applications.ts
import { Env } from "../env";
import { sign, verify } from '@tsndr/cloudflare-worker-jwt';

interface BookingSlot {
    date: string;
    time: string;
    roomId: string;
}

interface BookingRequest {
    name: string;
    email: string;
    organization: string;
    phone: string;
    purpose: string;
    multipleSlots: BookingSlot[];
    turnstileToken: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
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

        // 撈出所有 applications（含申請人資訊）
        const applications = await env.DB.prepare(
            `SELECT * FROM applications ORDER BY submitted_at DESC`
        ).all();

        // 對每個 application 撈出對應時段
        const withSlots = await Promise.all(
            applications.results.map(async (app) => {
                // 撈出請求的時段
                const { results: requestedSlots } = await env.DB.prepare(
                    `SELECT * FROM requested_slots WHERE application_id = ?`
                ).bind(app.id).all();

                // 撈出已確認的時段
                const { results: bookedSlots } = await env.DB.prepare(
                    `SELECT * FROM booked_slots WHERE application_id = ?`
                ).bind(app.id).all();

                // 合併時段資訊
                const allSlots = [
                    ...requestedSlots,
                    ...bookedSlots.map(slot => ({
                        ...slot,
                        status: 'confirmed' // 已確認的時段狀態固定為 confirmed
                    }))
                ];

                return { ...app, requested_slots: allSlots };
            })
        );

        return new Response(JSON.stringify(withSlots), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("GET /api/applications error:", err);
        return new Response(JSON.stringify({
            error: err.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

// 檢查時段是否可用
async function checkSlotAvailability(env: Env, slots: BookingSlot[]): Promise<{ available: boolean; conflictMessage?: string }> {
    for (const slot of slots) {
        const startHour = parseInt(slot.time.split(':')[0]);
        const endHour = (startHour + 1) % 24;
        const startTime = `${String(startHour).padStart(2, '0')}:00`;
        const endTime = `${String(endHour).padStart(2, '0')}:00`;

        // 檢查是否有正在審核中的申請
        const pendingSlots = await env.DB.prepare(`
            SELECT rs.*, a.status 
            FROM requested_slots rs
            JOIN applications a ON rs.application_id = a.id
            WHERE rs.room_id = ? 
            AND rs.date = ?
            AND rs.start_time = ?
            AND rs.end_time = ?
            AND a.status = 'pending'
        `).bind(slot.roomId, slot.date, startTime, endTime).all();

        if (pendingSlots.results.length > 0) {
            return {
                available: false,
                conflictMessage: `所選時段 ${slot.date} ${startTime}-${endTime} 已有其他申請正在審核中`
            };
        }

        // 檢查是否已被預約
        const bookedSlots = await env.DB.prepare(`
            SELECT * FROM booked_slots
            WHERE room_id = ? 
            AND date = ?
            AND start_time = ?
            AND end_time = ?
        `).bind(slot.roomId, slot.date, startTime, endTime).all();

        if (bookedSlots.results.length > 0) {
            return {
                available: false,
                conflictMessage: `所選時段 ${slot.date} ${startTime}-${endTime} 已被預約`
            };
        }
    }

    return { available: true };
}

// 驗證 Turnstile token
async function verifyTurnstileToken(token: string, env: Env): Promise<boolean> {
    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: env.TURNSTILE_SECRET_KEY,
                response: token,
            }),
        });

        const result = await response.json() as { success: boolean };
        return result.success === true;
    } catch (error) {
        console.error('Turnstile verification error:', error);
        return false;
    }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const data = await request.json() as BookingRequest;

        // 驗證 Turnstile token
        if (!data.turnstileToken) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing Turnstile token'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const isValidToken = await verifyTurnstileToken(data.turnstileToken, env);
        if (!isValidToken) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid Turnstile token'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!data.multipleSlots?.length) {
            return new Response(JSON.stringify({
                success: false,
                error: '請至少選擇一個時段'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 驗證信箱格式
        if (!data.email.endsWith('ndhu.edu.tw')) {
            return new Response(JSON.stringify({
                success: false,
                error: '請使用東華大學校園信箱'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 檢查時段是否可用
        const availabilityCheck = await checkSlotAvailability(env, data.multipleSlots);
        if (!availabilityCheck.available) {
            return new Response(JSON.stringify({
                success: false,
                error: availabilityCheck.conflictMessage
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 從第一個時段取得 room_id
        const roomId = data.multipleSlots[0].roomId;

        // 開始資料庫交易
        const result = await env.DB.prepare(
            `INSERT INTO applications (
                name, email, organization, phone, purpose, room_id
            ) VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
            data.name,
            data.email,
            data.organization || '',
            data.phone || '',
            data.purpose || '',
            roomId
        ).run();

        const applicationId = result.meta.last_row_id;
        if (!applicationId) {
            throw new Error("取得 applicationId 失敗");
        }

        console.log('Created application:', applicationId);

        // 插入所有選定的時段
        const slotInserts = data.multipleSlots.map(slot => {
            const startHour = parseInt(slot.time.split(':')[0]);
            const endHour = (startHour + 1) % 24;

            const startTime = `${String(startHour).padStart(2, '0')}:00`;
            const endTime = `${String(endHour).padStart(2, '0')}:00`;

            console.log(`Creating slot: ${slot.date} ${startTime}-${endTime}`);

            return env.DB.prepare(
                `INSERT INTO requested_slots (
                    application_id, room_id, date, start_time, end_time
                ) VALUES (?, ?, ?, ?, ?)`
            ).bind(
                applicationId,
                slot.roomId,
                slot.date,
                startTime,
                endTime
            );
        });

        const slotResults = await env.DB.batch(slotInserts);
        console.log('Created slots:', slotResults.map(r => r.meta.lastRowId));

        // 發送確認郵件給申請者
        const GAS_EMAIL_API_URL = env.GAS_EMAIL_API_URL;
        try {
            // 格式化申請時段資訊
            const slotsInfo = data.multipleSlots
                .map(slot => {
                    const startHour = parseInt(slot.time.split(':')[0]);
                    const endHour = (startHour + 1) % 24;
                    const startTime = `${String(startHour).padStart(2, '0')}:00`;
                    const endTime = `${String(endHour).padStart(2, '0')}:00`;
                    return {
                        date: slot.date,
                        time: `${startTime}-${endTime}`,
                        timestamp: new Date(`${slot.date}T${startTime}`).getTime()
                    };
                })
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(slot => `${slot.date} ${slot.time}`)
                .join('\n');

            const emailResponse = await fetch(GAS_EMAIL_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateKey: 'APPLICANT_SUBMISSION',
                    to: data.email,
                    templateData: {
                        applicantName: data.name,
                        applicationId: applicationId.toString(),
                        applicationSpace: roomId,
                        organization: data.organization || '未填寫',
                        applicationDetails: `申請人：${data.name}
申請單位：${data.organization || '未填寫'}
聯絡電話：${data.phone || '未填寫'}
使用目的：${data.purpose || '未填寫'}

申請空間：${roomId}
申請時段：
${slotsInfo}`,
                        contactInfo: '系辦電話：03-890-3111\nEmail：am@ndhu.edu.tw'
                    }
                })
            });

            const emailResult = await emailResponse.json() as { success: boolean; message?: string; error?: string };
            if (!emailResult.success) {
                console.error('Failed to send confirmation email:', emailResult.message || 'Unknown error');
            }

            // 發送通知郵件給啟用的管理員
            try {
                // 獲取所有啟用的管理員
                const { results: activeAdmins } = await env.DB.prepare(
                    `SELECT email, name FROM admins WHERE is_active = 1`
                ).all();

                if (activeAdmins && activeAdmins.length > 0) {
                    // 為每個管理員發送通知
                    const adminNotifications = activeAdmins.map(admin =>
                        fetch(GAS_EMAIL_API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                templateKey: 'ADMIN_REVIEW_REMINDER',
                                to: admin.email,
                                templateData: {
                                    applicationId: applicationId.toString(),
                                    applicantName: data.name,
                                    organization: data.organization || '未填寫',
                                    submissionTime: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
                                    applicationSpace: roomId,
                                    reviewLink: `${env.APP_URL}/review`
                                }
                            })
                        })
                    );

                    // 等待所有郵件發送完成
                    const adminEmailResults = await Promise.all(adminNotifications);
                    const adminEmailResponses = await Promise.all(
                        adminEmailResults.map(r => r.json() as Promise<{ success: boolean; message?: string; error?: string }>)
                    );

                    // 檢查是否有發送失敗的郵件
                    const failedEmails = adminEmailResponses
                        .filter((result, index) => !result.success)
                        .map((_, index) => activeAdmins[index].email);

                    if (failedEmails.length > 0) {
                        console.error('Failed to send notification emails to some admins:', failedEmails);
                    }
                }
            } catch (adminEmailError) {
                console.error('Admin notification email sending error:', adminEmailError);
                // 不中斷流程，繼續執行
            }
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // 不中斷流程，繼續回傳成功訊息
        }

        // 產生驗證 token
        const verifyToken = await sign(
            {
                applicationId,
                email: data.email,
                exp: Math.floor(Date.now() / 1000) + 86400 // 24小時
            },
            env.JWT_SECRET
        );

        // TODO: 發送驗證郵件
        // await fetch('https://api.mailchannels.net/tx/v1/send', {
        //     method: 'POST',
        //     headers: { 'content-type': 'application/json' },
        //     body: JSON.stringify({
        //         from: { email: "noreply@ndhuam.edu.tw" },
        //         to: [{ email: data.email }],
        //         subject: "空間預約驗證",
        //         content: [{
        //             type: "text/plain",
        //             value: `請點擊連結驗證預約：${env.APP_URL}/verify?token=${verifyToken}`
        //         }]
        //     })
        // });

        return new Response(JSON.stringify({
            success: true,
            message: '預約申請已送出，請等待應數系辦審核。',
            applicationId,
            verifyToken
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error("POST /api/applications error:", err);
        return new Response(JSON.stringify({
            success: false,
            error: err.message || "系統錯誤，請稍後再試"
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};