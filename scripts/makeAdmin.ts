import 'dotenv/config';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uninotes';

async function makeAdmin() {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB!');

        const db = client.db();

        // Find the most recently created user
        const user = await db.collection('users').find().sort({ createdAt: -1 }).limit(1).next();

        if (!user) {
            console.log('No users found!');
            return;
        }

        console.log(`Found user: ${user.name} (${user.email})`);

        // Update user to admin
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { role: 'admin' } }
        );

        console.log(`✅ Successfully made ${user.name} an ADMIN!`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

makeAdmin();
