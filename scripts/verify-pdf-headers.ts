
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars from root
dotenv.config({ path: resolve(__dirname, '../.env') });

console.log('GROQ_KEY Present:', !!(process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY));
console.log('SUPABASE_URL Present:', !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL));

// Mock Vercel Request/Response
const req = {
    method: 'POST',
    headers: {
        authorization: 'Bearer test-token'
    },
    body: {
        prompt: 'Application to principal for sick leave for Abhi',
        font: 'times'
    }
} as any;

const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
        this.headers[name] = value;
    },
    status(code: number) {
        this.statusCode = code;
        return this;
    },
    json(data: any) {
        console.log('JSON Response:', data);
        return this;
    },
    send(data: any) {
        console.log('Sent data (length):', data?.length || 'unknown');
        return this;
    }
} as any;

async function run() {
    try {
        const handlerModule = await import('../api/generate-pdf');
        const handler = handlerModule.default;

        console.log('Running handler with prompt:', req.body.prompt);
        await handler(req, res);

        console.log('Status Code:', res.statusCode);
        console.log('Headers:', res.headers);

        const contentDisposition = res.headers['Content-Disposition'];
        if (contentDisposition && contentDisposition.includes('filename=')) {
            console.log('SUCCESS: Content-Disposition header found with filename');
        } else {
            console.error('FAILURE: Content-Disposition header missing or invalid');
        }

    } catch (e: any) {
        console.error('Error running handler:', e.message);
        console.error(e.stack);
        if (e.response) {
            console.error('API Error Response:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

run();
