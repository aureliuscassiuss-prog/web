return jwt.verify(authHeader.substring(7), process.env.JWT_SECRET!) as { userId: string };
    } catch (e) { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const user = verifyToken(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        if (req.method === 'GET') {
            const { data: progress } = await supabase
                .from('video_progress')
                .select('*')
                .eq('userId', user.userId);

            const progressMap: Record<string, any> = {};
            if (progress) {
                progress.forEach((item: any) => {
                    progressMap[item.videoId] = {
                        completed: item.completed,
                        completedAt: item.completedAt,
                        subjectName: item.subjectName,
                        programId: item.programId,
                        yearId: item.yearId,
                        courseId: item.courseId
                    };
                });
            }
            return res.status(200).json({ progress: progressMap });
        }

        if (req.method === 'POST') {
            const { videoId, completed, subjectName, programId, yearId, courseId } = req.body;
            if (!videoId) return res.status(400).json({ error: 'videoId is required' });

            const { error } = await supabase
                .from('video_progress')
                .upsert({
                    userId: user.userId,
                    videoId,
                    completed: completed !== false,
                    completedAt: new Date(),
                    subjectName: subjectName || '',
                    programId: programId || '',
                    yearId: yearId || '',
                    courseId: courseId || '',
                    updatedAt: new Date()
                }, { onConflict: 'userId,videoId' }); // Relies on unique index

            if (error) throw error;

            return res.status(200).json({
                success: true,
                completed: completed !== false,
                message: completed !== false ? 'Video marked as complete' : 'Video marked as incomplete'
            });
        }
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Progress API Error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
