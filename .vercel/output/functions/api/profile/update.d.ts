import type { VercelRequest, VercelResponse } from '@vercel/node';
export declare const config: {
    api: {
        bodyParser: boolean;
    };
};
export default function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | undefined>;
