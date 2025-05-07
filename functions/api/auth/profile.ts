import { verify } from '@tsndr/cloudflare-worker-jwt'
import { Env } from '../../env'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No token provided'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.split(' ')[1];

        // Validate env
        if (!env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }

        const isValid = await verify(token, env.JWT_SECRET);
        if (!isValid) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid token'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));

            // Get admin information from database
            const { results: adminResults } = await env.DB.prepare(`
                SELECT name, email, is_active 
                FROM admins 
                WHERE email = ? AND is_active = 1
            `).bind(payload.email.toLowerCase()).all();

            if (adminResults.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Admin not found or inactive'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const admin = adminResults[0];

            // Return admin profile and token information
            return new Response(JSON.stringify({
                success: true,
                data: {
                    name: admin.name,
                    email: admin.email,
                    token: {
                        expiresAt: payload.exp * 1000, // Convert to milliseconds
                        issuedAt: payload.iat * 1000
                    }
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (parseError) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid token payload'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (err) {
        console.error('Profile error:', err);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal Server Error',
            details: err.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 