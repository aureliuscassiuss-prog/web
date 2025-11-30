import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI || '';
if (!uri) {
    throw new Error('Please add MONGODB_URI to your environment variables');
}
const options = {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    tls: true,
    tlsAllowInvalidCertificates: true, // Temporary fix for SSL handshake issue
};
let client;
let clientPromise;
// Always use global cached connection
if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
        console.error('MongoDB connection error:', err);
        throw err;
    });
}
clientPromise = global._mongoClientPromise;
async function getDb() {
    try {
        const client = await clientPromise;
        return client.db('uninotes');
    }
    catch (error) {
        console.error('Error getting database:', error);
        throw error;
    }
}
export { getDb };
export default clientPromise;
