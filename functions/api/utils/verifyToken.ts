import { verify } from '@tsndr/cloudflare-worker-jwt'

export async function verifyToken(request: Request, env: { JWT_SECRET: string }): Promise<string | null> {
    // Temporarily disable authentication
    return "guest"

    // Original authentication logic
    /*
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.split(' ')[1]
    try {
        const isValid = await verify(token, env.JWT_SECRET)
        if (!isValid) return null

        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.username
    } catch {
        return null
    }
    */
}
