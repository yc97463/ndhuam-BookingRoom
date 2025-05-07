import { sign } from '@tsndr/cloudflare-worker-jwt'
import { Env } from '../../env'

interface LoginRequest {
    email: string;
    turnstileToken: string;
}

interface LoginResponse {
    message: string;
}

interface ErrorResponse {
    error: string;
    code: string;
}

// Helper function to generate random delay between min and max seconds
const randomDelay = (min: number, max: number) => {
    const delay = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
};

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
        const payload = await request.json() as LoginRequest;

        // 驗證 Turnstile token
        if (!payload.turnstileToken) {
            const error: ErrorResponse = {
                error: "Missing Turnstile token",
                code: "MISSING_TURNSTILE"
            };
            return new Response(JSON.stringify(error), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const isValidToken = await verifyTurnstileToken(payload.turnstileToken, env);
        if (!isValidToken) {
            const error: ErrorResponse = {
                error: "Invalid Turnstile token",
                code: "INVALID_TURNSTILE"
            };
            return new Response(JSON.stringify(error), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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

        // Check if the email is in the admins table
        const { results: adminResults } = await env.DB.prepare(`
            SELECT id FROM admins 
            WHERE email = ? AND is_active = 1
        `).bind(payload.email.toLowerCase()).all();

        const isAdmin = adminResults.length > 0;

        // Always return the same message regardless of admin status
        const loginResponse: LoginResponse = {
            message: "Please check your email for verification link. You will receive a mail if you are the admins."
        };

        // Only proceed with email sending if the user is an admin
        if (isAdmin) {
            const verifyToken = await sign(
                {
                    email: payload.email,
                    exp: Math.floor(Date.now() / 1000) + 600  // 10 minutes
                },
                env.JWT_SECRET
            );

            const verifyUrl = `${env.APP_URL}/auth/verify?token=${verifyToken}`;

            const GAS_EMAIL_API_URL = env.GAS_EMAIL_API_URL;

            // 處理 IP 地址
            const getClientIP = (request: Request): string => {
                // 優先使用 X-Forwarded-For
                const forwardedFor = request.headers.get('X-Forwarded-For');
                if (forwardedFor) {
                    // 取第一個 IP（最原始的客戶端 IP）
                    const firstIP = forwardedFor.split(',')[0].trim();
                    // 如果是 IPv6 的 localhost，返回 localhost
                    if (firstIP === '::1') return 'localhost';
                    return firstIP;
                }

                // 其次使用 CF-Connecting-IP
                const cfIP = request.headers.get('CF-Connecting-IP');
                if (cfIP) {
                    if (cfIP === '::1') return 'localhost';
                    return cfIP;
                }

                // 最後使用 X-Real-IP
                const realIP = request.headers.get('X-Real-IP');
                if (realIP) {
                    if (realIP === '::1') return 'localhost';
                    return realIP;
                }

                return '未知';
            };

            try {
                const emailResponse = await fetch(GAS_EMAIL_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        templateKey: 'LOGIN_MAGIC_LINK',
                        to: payload.email,
                        templateData: {
                            loginLink: verifyUrl,
                            expiryTime: '10 分鐘',
                            loginAccount: payload.email,
                            loginTime: new Date().toLocaleString('zh-TW', {
                                timeZone: 'Asia/Taipei',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            }),
                            loginIP: getClientIP(request),
                            loginBrowser: request.headers.get('User-Agent') || '未知'
                        }
                    })
                });

                const emailResult = await emailResponse.json() as { success: boolean; message?: string; error?: string };
                if (!emailResult.success) {
                    throw new Error(emailResult.message || 'Failed to send email');
                }
            } catch (emailError) {
                console.error('Email sending error:', emailError);
                // Don't expose the error to the client
            }
        } else {
            // Add random delay for non-admin users (2-5 seconds)
            await randomDelay(1, 5);
        }

        return new Response(JSON.stringify(loginResponse), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });
    } catch (err) {
        console.error('Login error:', err);
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
