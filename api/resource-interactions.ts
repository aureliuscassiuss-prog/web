    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const userId = decoded.userId;

        const { resourceId, action, value } = req.body; // action: like, dislike, save, flag, rate

        if (!resourceId) return res.status(400).json({ message: 'Resource ID required' });

        // Get current resource
        const { data: resource, error: fetchError } = await supabase
            .from('resources')
            .select('*')
            .eq('_id', resourceId)
            .single();

        if (fetchError || !resource) return res.status(404).json({ message: 'Resource not found' });

        // Helper to Toggle in Array
        const toggle = (arr: string[], id: string) => {
            if (!arr) arr = [];
            const idx = arr.indexOf(id);
            if (idx === -1) arr.push(id);
            else arr.splice(idx, 1);
            return arr;
        };

        let updates: any = {};
        let message = '';

        if (action === 'like') {
            let likedBy = resource.likedBy || [];
            let dislikedBy = resource.dislikedBy || [];

            // If already disliked, remove dislike
            if (dislikedBy.includes(userId)) {
                dislikedBy = dislikedBy.filter((id: string) => id !== userId);
                updates.dislikedBy = dislikedBy;
                updates.dislikes = dislikedBy.length;
            }

            likedBy = toggle(likedBy, userId);
            updates.likedBy = likedBy;
            updates.likes = likedBy.length;
            message = likedBy.includes(userId) ? 'Liked' : 'Unliked';
        }
        else if (action === 'dislike') {
            let likedBy = resource.likedBy || [];
            let dislikedBy = resource.dislikedBy || [];

            // If already liked, remove like
            if (likedBy.includes(userId)) {
                likedBy = likedBy.filter((id: string) => id !== userId);
                updates.likedBy = likedBy;
                updates.likes = likedBy.length;
            }

            dislikedBy = toggle(dislikedBy, userId);
            updates.dislikedBy = dislikedBy;
            updates.dislikes = dislikedBy.length;
            message = dislikedBy.includes(userId) ? 'Disliked' : 'Undisliked';
        }
        else if (action === 'save') {
            let savedBy = toggle(resource.savedBy || [], userId);
            updates.savedBy = savedBy;
            message = savedBy.includes(userId) ? 'Saved' : 'Unsaved';
        }
        else if (action === 'flag') {
            let flaggedBy = toggle(resource.flaggedBy || [], userId);
            updates.flaggedBy = flaggedBy;
            updates.flags = flaggedBy.length;
            message = 'Flagged';
        }
        else if (action === 'rate') {
            // Basic rating - just separate logic if needed, or simple field
            // For now assume rating is not array based or complex
            updates.rating = value;
            message = 'Rated';
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const { error: updateError } = await supabase
            .from('resources')
            .update(updates)
            .eq('_id', resourceId);

        if (updateError) throw updateError;

        return res.status(200).json({ message, ...updates });

    } catch (error) {
        console.error('Interaction Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
