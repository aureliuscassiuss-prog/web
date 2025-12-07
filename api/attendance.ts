res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

if (req.method === 'OPTIONS') return res.status(200).end();

const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
}

let userId: string;
try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    userId = decoded.userId;
} catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
}

try {
    if (req.method === 'GET') {
        const { data } = await supabase
            .from('attendance')
            .select('*')
            .eq('userId', userId)
            .single();
        return res.status(200).json(data || { subjects: [], logs: [] });
    }

    if (req.method === 'POST') {
        const { subjects, logs } = req.body;

        const { error } = await supabase
            .from('attendance')
            .upsert({
                userId,
                subjects,
                logs,
                updatedAt: new Date()
            }, { onConflict: 'userId' });

        if (error) throw error;

        return res.status(200).json({ message: 'Attendance saved successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
} catch (error) {
    console.error('Attendance API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
}
}
