import { verify, sign } from '@tsndr/cloudflare-worker-jwt'
import { Env } from '../../env'
import { verifyTurnstileToken } from '../../utils/turnstile'

interface VerifyRequest {
    token: string;
    turnstileToken: string;
}

interface VerifyResponse {
    token: string;
    expiresIn: number;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const { token, turnstileToken } = await request.json() as VerifyRequest;

        if (!token) {
            return new Response(JSON.stringify({ error: 'Missing token' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!turnstileToken) {
            return new Response(JSON.stringify({ error: 'Missing Turnstile token' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify Turnstile token
        const isTurnstileValid = await verifyTurnstileToken(turnstileToken, env);
        if (!isTurnstileValid) {
            return new Response(JSON.stringify({ error: 'Invalid Turnstile token' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate env
        if (!env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }

        if (!env.APP_URL) {
            throw new Error('APP_URL is not configured');
        }

        const isValid = await verify(token, env.JWT_SECRET);
        if (!isValid) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));

            // Check if the email is in the admins table
            const { results: adminResults } = await env.DB.prepare(`
                SELECT id FROM admins 
                WHERE email = ? AND is_active = 1
            `).bind(payload.email.toLowerCase()).all();

            if (adminResults.length === 0) {
                return new Response(JSON.stringify({
                    error: 'Not authorized as admin',
                    message: '此信箱未註冊為管理員或已被停用'
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const expiresIn = 24 * 60 * 60; // 24 hours

            const newToken = await sign(
                {
                    email: payload.email,
                    exp: Math.floor(Date.now() / 1000) + expiresIn
                },
                env.JWT_SECRET
            );

            // Construct redirect URL
            const baseUrl = env.APP_URL.replace(/\/$/, '');
            const redirectUrl = `${baseUrl}/auth/callback?token=${encodeURIComponent(newToken)}`;

            return new Response(JSON.stringify({
                success: true,
                token: newToken,
                redirectUrl
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (parseError) {
            return new Response(JSON.stringify({ error: 'Invalid token payload' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (err) {
        console.error('Verification error:', err);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            details: err.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
