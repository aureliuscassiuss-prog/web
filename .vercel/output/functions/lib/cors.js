export function enableCors(req, res) {
    // Allow requests from your frontend domains
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://your-vercel-app.vercel.app'
    ];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    else {
        // For production, you might want to be more restrictive
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}
export function handleCors(req, res) {
    enableCors(req, res);
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}
