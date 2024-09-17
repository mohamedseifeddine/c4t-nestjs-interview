import * as mongoose from "mongoose";
import {LoggerAdapter} from "../logger/LoggerAdapter";

export default class MongoAdapter {


    static async connectToMongoWithMongoose(mongoUrl: string): Promise<mongoose.Mongoose> {
        const logger = new LoggerAdapter(MongoAdapter);
        logger.info(`connect to database on url : ${mongoUrl}`)
        return await mongoose.connect(
            mongoUrl,
            {
                ignoreUndefined: true
            });
    }
}
