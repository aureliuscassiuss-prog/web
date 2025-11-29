import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../lib/mongodb.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const db = await getDb();

        // Get top users by reputation
        const topUsers = await db.collection('users')
            .find({})
            .sort({ reputation: -1 })
            .limit(10)
            .project({
                name: 1,
                reputation: 1,
                avatar: 1,
                uploads: 1
            })
            .toArray();

        // Calculate upload counts for each user
        const leaderboard = await Promise.all(
            topUsers.map(async (user, index) => {
                const uploadCount = await db.collection('resources')
                    .countDocuments({ uploaderId: user._id.toString() });

                return {
                    rank: index + 1,
                    name: user.name,
                    points: user.reputation || 0,
                    uploads: uploadCount,
                    avatar: user.avatar || 'boy1'
                };
            })
        );

        res.status(200).json({ leaderboard });
    } catch (error) {
        console.error('Leaderboard error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}
