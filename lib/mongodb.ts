
import { MongoClient, Db } from 'mongodb';

const uri: string = process.env.MONGODB_URI || '';

if (!uri) {
    throw new Error('Please add MONGODB_URI to your environment variables');
}

const options = {
    maxPoolSize: 5,
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
    console.error('[MongoDB] Init: Creating new client...');
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect()
        .then(c => {
            console.error('[MongoDB] Init: Connection established');
            return c;
        })
        .catch(err => {
            console.error('[MongoDB] Init: Connection failed:', err);
            throw err;
        });
}
clientPromise = global._mongoClientPromise;

async function getDb(): Promise<Db> {
    try {
        // Ensure we have a promise to await
        if (!global._mongoClientPromise) {
            console.error('[MongoDB] Retry: Connecting to new client...');
            client = new MongoClient(uri, options);
            global._mongoClientPromise = client.connect()
                .then(c => {
                    console.error('[MongoDB] Retry: Connection established');
                    return c;
                })
                .catch(err => {
                    console.error('[MongoDB] Retry: Connection failed:', err);
                    throw err;
                });
        }

        console.error('[MongoDB] getDb: Awaiting connection promise...');
        const client = await global._mongoClientPromise;
        console.error('[MongoDB] getDb: Client ready. returning db.');
        return client.db('uninotes');
    } catch (error) {
        console.error('[MongoDB] Error in getDb:', error);
        // Reset the promise so the next request tries to connect again
        global._mongoClientPromise = undefined;
        throw error;
    }
}

export { getDb };
export default clientPromise;
