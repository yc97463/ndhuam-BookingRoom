import { Env } from '../../env';
import { verify } from '@tsndr/cloudflare-worker-jwt';

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

        const { rooms = [] } = await request.json() as { rooms?: any[] };
        const cleanedRooms = rooms.map(({ tempId, ...room }) => room);

        // First, get existing rooms to handle foreign key constraints
        const { results: existingRooms } = await env.DB.prepare(`
            SELECT room_id FROM rooms
            WHERE room_id IN (
                SELECT DISTINCT room_id FROM requested_slots
            )
        `).all();

        const roomsInUse = new Set(existingRooms.map((r: any) => r.room_id));

        // Prepare statement for updating or inserting rooms
        const stmt = env.DB.prepare(`
            INSERT OR REPLACE INTO rooms (
                room_id, 
                room_name, 
                location, 
                capacity, 
                "order",
                is_active
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        // Create batch operations
        const batch = cleanedRooms.map(room =>
            stmt.bind(
                room.roomId,
                room.roomName,
                room.location,
                room.capacity,
                room.order,
                room.isActive ? 1 : 0
            )
        );

        // Find rooms to be deleted (not in new list but existing in DB)
        const newRoomIds = new Set(cleanedRooms.map(r => r.roomId));
        const deleteStmt = env.DB.prepare(`
            DELETE FROM rooms 
            WHERE room_id = ? 
            AND room_id NOT IN (
                SELECT DISTINCT room_id FROM requested_slots
            )
        `);

        const deleteBatch = Array.from(roomsInUse)
            .filter(roomId => !newRoomIds.has(roomId))
            .map(roomId => deleteStmt.bind(roomId));

        // Execute all operations
        await env.DB.batch([...batch, ...deleteBatch]);

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Error in /admin/rooms:', err);
        return new Response(JSON.stringify({
            error: err.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
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
                room_id as "roomId",
                room_name as "roomName",
                location,
                capacity,
                "order",
                is_active as "isActive"
            FROM rooms 
            ORDER BY "order" ASC, room_id ASC
        `).all();

        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Error in GET /admin/rooms:', err);
        return new Response(JSON.stringify({
            error: err.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
