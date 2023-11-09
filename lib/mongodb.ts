
import { Db, MongoClient, MongoOptions } from 'mongodb';

class RHDatabase {
    private url: string;
    private client: MongoClient;
    private database: any;
    options: MongoOptions | undefined;
    collection: any;

    constructor(){
        this.url = process.env.MONGODB_URL || ''
        console.log(this.url)
        this.client = new MongoClient(this.url);
        this.connect()

        this.database = (dbname: string) => this.useDatabase(dbname)
        this.collection = (collection: any) => this.database.collection(collection)
    }

    async connect(){
        await this.client.connect()
        console.log('[INFO] Connection to database successfull.')
    }

    useDatabase(dbname: string): Db {
        return this.client.db(dbname)
    }

    limitDefaultData() {
        return {
            name: 'silentmention',
            sender: '',
            limit: ''
        }
    }

    adminDefaultData(m: any) {
        return {
            to: m.parse.to,
            admins: []
        }
    }
}

export default RHDatabase