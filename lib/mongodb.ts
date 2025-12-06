import { MongoClient, Db } from 'mongodb';

const uri: string = process.env.MONGODB_URI || '';

if (!uri) {
    throw new Error('Please add MONGODB_URI to your environment variables');
}

const options = {
    maxPoolSize: 5, // Increased from 1 to avoid blocking concurrent requests in same container
    minPoolSize: 0,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    tls: true,
    tlsAllowInvalidCertificates: true,
    retryWrites: true,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Always use global cached connection
if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
        console.error('MongoDB connection error:', err);
        throw err;
    });
}
clientPromise = global._mongoClientPromise;

async function getDb(): Promise<Db> {
    try {
        const client = await clientPromise;
        return client.db('uninotes');
    } catch (error) {
        console.error('Error getting database:', error);
        throw error;
    }
}

export { getDb };
export default clientPromise;
