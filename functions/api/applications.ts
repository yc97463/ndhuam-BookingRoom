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
                const { results: slots } = await env.DB.prepare(
                    `SELECT * FROM requested_slots WHERE application_id = ?`
                ).bind(app.id).all();
                return { ...app, requested_slots: slots };
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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const data = await request.json() as BookingRequest;

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