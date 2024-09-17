import mongoose from "mongoose";
import {MongoModelWithLog} from "./MongoModelWithLog";
import {LoggerAdapter} from "../logger/LoggerAdapter";

export class MongoClientWithLog {
    logger = new LoggerAdapter(MongoClientWithLog)
    constructor(private mongoClient: mongoose.Mongoose) {
    }

    model(collectionName: string, schema: mongoose.Schema<any>) {
        return new MongoModelWithLog(this.mongoClient.models[collectionName] ||
            this.mongoClient.model(collectionName, schema, collectionName))
    }
}
