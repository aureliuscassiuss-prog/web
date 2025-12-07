
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/mongodb.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');

    // Log intent
    console.error('[Health-Shared] Starting check using getDb()');
    const start = Date.now();

    try {
        console.error('[Health-Shared] Calling getDb()...');
        const db = await getDb();
        console.error('[Health-Shared] getDb() returned. Fetching stats...');

        const userCount = await db.collection('users').estimatedDocumentCount();
        const duration = Date.now() - start;

        console.error(`[Health-Shared] Success! Found ${userCount} users in ${duration}ms`);

        return res.status(200).json({
            status: 'ok',
            message: 'Shared database connection healthy',
            userCount,
            duration: `${duration}ms`
        });

    } catch (error: any) {
        console.error('[Health-Shared] FAILED:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Shared connection failed',
            duration: `${Date.now() - start}ms`,
            error: {
                name: error.name,
                message: error.message
            }
        });
    }
}
