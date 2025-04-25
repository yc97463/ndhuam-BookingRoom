import { sign } from '@tsndr/cloudflare-worker-jwt'
import { Env } from '../../env'

interface LoginRequest {
    email: string;
}

interface LoginResponse {
    message: string;
    temp_token: string;
}

interface ErrorResponse {
    error: string;
    code: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const payload = await request.json() as LoginRequest;

        if (!payload.email?.endsWith('ndhu.edu.tw')) {
            const error: ErrorResponse = {
                error: "Invalid email domain",
                code: "INVALID_EMAIL"
            };
            return new Response(JSON.stringify(error), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const verifyToken = await sign(
            {
                email: payload.email,
                exp: Math.floor(Date.now() / 1000) + 600  // 10 minutes
            },
            env.JWT_SECRET
        );

        const verifyUrl = `${env.APP_URL}/auth/verify?token=${verifyToken}`;

        console.log("Verification URL:", verifyUrl);

        // Send email using Cloudflare Email Workers
        await fetch('https://api.mailchannels.net/tx/v1/send', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                from: {
                    email: "noreply@ndhuam.edu.tw",
                    name: "NDHU AM Room Booking"
                },
                to: [{ email: payload.email }],
                subject: "登入驗證連結 - NDHU AM Room Booking",
                content: [{
                    type: "text/plain",
                    value: `請按這裡以下連結登入系統：\n\n${verifyUrl}\n\n此連結將在 10 分鐘後失效。`
                }]
            })
        });

        const response: LoginResponse = {
            message: "Please check your email for verification link",
            temp_token: verifyToken
        };

        return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });
    } catch (err) {
        const error: ErrorResponse = {
            error: "Internal Server Error",
            code: "SERVER_ERROR"
        };
        return new Response(JSON.stringify(error), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
