import {DataBaseBuilder} from "./DataBaseBuilder";
import mongoose from "mongoose";
import {DatabaseConfigBuilder} from "./DatabaseConfigBuilder";

export class StorageRealBuilder<T> implements DataBaseBuilder<T> {
    mongoClient: mongoose.Mongoose | undefined

    constructor(private delegateCreate: (mongoClient: mongoose.Mongoose | undefined) => T) {
    }

    async build() {
        this.mongoClient = await mongoose.connect(DatabaseConfigBuilder.loadConfig(),
            {
                dbName: Math.floor(Math.random()*1000).toString(),
                ignoreUndefined: true
            })
        return this.delegateCreate(this.mongoClient)
    }

    async close() {
        await this.mongoClient!.connection?.db.dropDatabase()
        await this.mongoClient!.connection?.close();
    }
}
