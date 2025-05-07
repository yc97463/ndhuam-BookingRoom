import { Env } from '../../env';
import { verify } from '@tsndr/cloudflare-worker-jwt';

interface Admin {
    id?: number;
    email: string;
    name: string;
    isActive: boolean;
    notifyReview: boolean;
}

const validateAdmin = (admin: Admin): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!admin.email) {
        errors.push('Email is required');
    } else if (!admin.email.endsWith('@ndhu.edu.tw')) {
        errors.push('Email must be from ndhu.edu.tw domain');
    }

    if (!admin.name) {
        errors.push('Name is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

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

        const { results } = await env.DB.prepare(`
            SELECT 
                id,
                email,
                name,
                is_active as "isActive",
                notify_review as "notifyReview"
            FROM admins 
            ORDER BY created_at DESC
        `).all();

        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Error in GET /admin/admins:', err);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            details: err.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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

        const { admins = [] } = await request.json() as { admins?: Admin[] };

        // Validate all admins
        const validationResults = admins.map(admin => ({
            admin,
            validation: validateAdmin(admin)
        }));

        const invalidAdmins = validationResults.filter(result => !result.validation.isValid);
        if (invalidAdmins.length > 0) {
            return new Response(JSON.stringify({
                error: 'Validation failed',
                details: invalidAdmins.map(result => ({
                    email: result.admin.email,
                    errors: result.validation.errors
                }))
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check for duplicate emails
        const emails = admins.map(admin => admin.email.toLowerCase());
        const uniqueEmails = new Set(emails);
        if (emails.length !== uniqueEmails.size) {
            return new Response(JSON.stringify({
                error: 'Duplicate emails found'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Prepare statement for updating or inserting admins
        const stmt = env.DB.prepare(`
            INSERT OR REPLACE INTO admins (
                email,
                name,
                is_active,
                notify_review
            ) VALUES (?, ?, ?, ?)
        `);

        // Create batch operations
        const batch = admins.map(admin =>
            stmt.bind(
                admin.email.toLowerCase(),
                admin.name,
                admin.isActive ? 1 : 0,
                admin.notifyReview ? 1 : 0
            )
        );

        // Find admins to be deleted (not in new list but existing in DB)
        const newEmails = new Set(admins.map(a => a.email.toLowerCase()));
        const deleteStmt = env.DB.prepare(`
            DELETE FROM admins 
            WHERE email NOT IN (${Array.from(newEmails).map(e => `'${e}'`).join(',') || "'none'"})
        `);

        // Execute all operations
        await env.DB.batch([...batch, deleteStmt]);

        return new Response(JSON.stringify({
            success: true,
            message: 'Admins updated successfully'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Error in POST /admin/admins:', err);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            details: err.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}; 