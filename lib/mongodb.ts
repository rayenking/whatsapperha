
import { Db, MongoClient, MongoOptions } from 'mongodb';

class RHDatabase {
    private url: string;
    private client: MongoClient;
    options: MongoOptions | undefined;

    constructor(){
        this.url = process.env.MONGODB_URL || ''
        console.log(this.url)
        this.client = new MongoClient(this.url);
        this.connect()
    }

    async connect(){
        await this.client.connect()
        console.log('[INFO] Connection to database successfull.')
    }

    useDatabase(dbname: string): Db {
        return this.client.db(dbname)
    }
}

export default RHDatabase