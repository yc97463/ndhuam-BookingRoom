import { Env } from '../env';

interface TurnstileResponse {
    success: boolean;
    error_codes?: string[];
}

export async function verifyTurnstileToken(token: string, env: Env): Promise<boolean> {
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

        const data = await response.json() as TurnstileResponse;
        return data.success === true;
    } catch (error) {
        console.error('Turnstile verification error:', error);
        return false;
    }
} 