import { MongoClient, Db } from 'mongodb';
declare let clientPromise: Promise<MongoClient>;
declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}
declare function getDb(): Promise<Db>;
export { getDb };
export default clientPromise;
