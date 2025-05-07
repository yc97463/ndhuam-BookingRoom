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

// Helper function to generate random delay between min and max seconds
const randomDelay = (min: number, max: number) => {
    const delay = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
};

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

            try {
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
