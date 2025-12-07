
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from root .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const uri = process.env.MONGODB_URI;

async function testConnection() {
    console.log('Testing MongoDB Connection...');

    if (!uri) {
        console.error('❌ MONGODB_URI is missing in .env file');
        return;
    }

    // Mask the URI for safety when printing
    const maskedUri = uri.replace(/(:[^:@]+@)/, ':****@');
    console.log(`Attempting to connect to: ${maskedUri}`);

    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000, // 5 seconds timeout for test
        connectTimeoutMS: 5000
    });

    try {
        await client.connect();
        console.log('✅ Successfully connected to MongoDB!');

        const db = client.db('uninotes');
        const count = await db.collection('users').countDocuments();
        console.log(`✅ Database "uninotes" is accessible.`);
        console.log(`ℹ️  Found ${count} users in the "users" collection.`);

    } catch (error: any) {
        console.error('\n❌ Connection Failed!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);

        if (error.message.includes('Server selection timed out')) {
            console.log('\nPossible causes:');
            console.log('1. IP Address not whitelisted in MongoDB Atlas.');
            console.log('   -> Go to Atlas > Network Access > Add IP Address > Add Current IP.');
            console.log('2. Firewall or Antivirus blocking port 27017.');
            console.log('3. Incorrect hostname in MONGODB_URI.');
        }
    } finally {
        await client.close();
    }
}

testConnection();
