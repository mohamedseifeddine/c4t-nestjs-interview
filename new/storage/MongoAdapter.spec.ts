import MongoAdapter from "./MongoAdapter";
import {DatabaseConfigBuilder} from "./DatabaseConfigBuilder";
import * as mongoose from "mongoose";


describe('MongoAdapter with mongoose', ()=>{

    let mongoCLient : mongoose.Mongoose
    beforeAll(async () => {

        mongoCLient = await MongoAdapter.connectToMongoWithMongoose(DatabaseConfigBuilder.loadConfig())
    })

    afterAll(async () => {
        await mongoCLient.connection?.close();
    })

    test('create db', async () => {
        const userModel = await mongoCLient.model('user', new mongoose.Schema({userId:Number}))

        await userModel.create({userId:18})

        expect((await userModel.findOne({userId:18}))!.userId).toEqual(18);
    })
})

