import { sign } from '@tsndr/cloudflare-worker-jwt'
import { Env } from '../../env'

interface LoginRequest {
    email: string;
}

interface LoginResponse {
    message: string;
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

        const GAS_EMAIL_API_URL = env.GAS_EMAIL_API_URL;

        const emailResponse = await fetch(GAS_EMAIL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                templateKey: 'LOGIN_MAGIC_LINK',
                to: payload.email,
                templateData: {
                    loginLink: verifyUrl,
                    expiryTime: '10 分鐘'
                }
            })
        });

        const emailResult = await emailResponse.json() as { success: boolean; message?: string; error?: string };
        if (!emailResult.success) {
            throw new Error(emailResult.message || 'Failed to send email');
        }

        const loginResponse: LoginResponse = {
            message: "Please check your email for verification link"
        };

        return new Response(JSON.stringify(loginResponse), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });
    } catch (err) {
        const error: ErrorResponse = {
            error: "Internal Server Error" + err,
            code: "SERVER_ERROR"
        };
        return new Response(JSON.stringify(error), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
