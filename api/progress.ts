import { VercelRequest, VercelResponse } from '@vercel/node'
import { MongoClient, ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

const MONGODB_URI = process.env.MONGODB_URI!
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

let cachedClient: MongoClient | null = null

async function connectToDatabase() {
    if (cachedClient) {
        return cachedClient
    }
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    cachedClient = client
    return client
}

// Verify JWT token and get user
function verifyToken(req: VercelRequest): { userId: string; email: string } | null {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.substring(7)
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
        return decoded
    } catch (error) {
        return null
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    try {
        // Verify authentication
        const user = verifyToken(req)
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const client = await connectToDatabase()
        const db = client.db('uninotes')
        const progressCollection = db.collection('video_progress')

        // GET - Fetch user's video progress
        if (req.method === 'GET') {
            const progress = await progressCollection.find({
                userId: user.userId
            }).toArray()

            // Return as a map of videoId -> completion data
            const progressMap: Record<string, any> = {}
            progress.forEach(item => {
                progressMap[item.videoId] = {
                    completed: item.completed,
                    completedAt: item.completedAt,
                    subjectName: item.subjectName,
                    programId: item.programId,
                    yearId: item.yearId,
                    courseId: item.courseId
                }
            })

            return res.status(200).json({ progress: progressMap })
        }

        // POST - Update video progress
        if (req.method === 'POST') {
            const { videoId, completed, subjectName, programId, yearId, courseId } = req.body

            if (!videoId) {
                return res.status(400).json({ error: 'videoId is required' })
            }

            // Upsert the progress record
            const result = await progressCollection.updateOne(
                { userId: user.userId, videoId },
                {
                    $set: {
                        userId: user.userId,
                        videoId,
                        completed: completed !== false, // Default to true
                        completedAt: new Date(),
                        subjectName: subjectName || '',
                        programId: programId || '',
                        yearId: yearId || '',
                        courseId: courseId || '',
                        updatedAt: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            )

            return res.status(200).json({
                success: true,
                completed: completed !== false,
                message: completed !== false ? 'Video marked as complete' : 'Video marked as incomplete'
            })
        }

        return res.status(405).json({ error: 'Method not allowed' })

    } catch (error) {
        console.error('Progress API Error:', error)
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}
