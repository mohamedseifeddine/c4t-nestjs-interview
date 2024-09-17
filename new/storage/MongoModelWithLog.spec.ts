import mongoose from "mongoose";
import { DateSimulator } from "../date-provider/DateSimulator";
import { LoggerAdapter } from "../logger/LoggerAdapter";
import { LogsStreamInMemory } from "../logger/LogsStreamInMemory";
import { MongoClientWithLog } from "./MongoClientWithLog";
import { MongoModelWithLog } from "./MongoModelWithLog";
import { StorageRealBuilder } from "./StorageRealBuilder";

class SimpleStorage {
    private simpleModel: MongoModelWithLog;

    constructor(private mongoClientWithLog: MongoClientWithLog) {
        this.simpleModel = mongoClientWithLog.model('aCollection',
            new mongoose.Schema({
                firstName: String
            })
        )
    }

    async create() {
        await this.simpleModel.create({firstName: 'Alice'})
    }

    async createWithError() {
        await this.simpleModel.create(123)
    }

    async find() {
        await this.simpleModel.find({firstName: 'Alice'})
    }

    async findWithError() {
        await this.simpleModel.find(123)
    }

    async findOne() {
        await this.simpleModel.findOne({firstName: 'Alice'})
    }

    async findOneWithError() {
        await this.simpleModel.findOne(123)
    }

    async findOneAndUpdate() {
        await this.simpleModel.findOneAndUpdate({firstName: 'Alice'})
    }

    async findOneAndUpdateWithError() {
        await this.simpleModel.findOneAndUpdate(123)
    }

    async updateOne() {
        await this.simpleModel.updateOne({firstName: 'Alice'})
    }

    async updateOneWithError() {
        await this.simpleModel.updateOne({}, {},12)
    }
    async aggregate() {
        await this.simpleModel.aggregate([{ $match: { firstName: 'Alice' } }])
    }

    async aggregateWithError() {
        await this.simpleModel.aggregate(123)
    }

    async updateMany() {
        await this.simpleModel.updateMany({ firstName: 'Alice' }, { firstName: 'Bob' })
    }

    async updateManyWithError() {
        await this.simpleModel.updateMany({}, {}, 12)
    }

    async countDocuments() {
        await this.simpleModel.countDocuments({firstName: 'Alice'})
    }
    async countDocumentsWithError() {
        await this.simpleModel.countDocuments({$invalidOperator: 'Alice'})
    }
    
}

let simpleStorage: SimpleStorage

describe.each([
    ['create', async () => {
        await simpleStorage.create()
    }, async () => {
        await simpleStorage.createWithError()
    }],
    ['find', async () => {
        await simpleStorage.find()
    }, async () => {
        await simpleStorage.findWithError()
    }],
    ['findOne', async () => {
        await simpleStorage.findOne()
    }, async () => {
        await simpleStorage.findOneWithError()
    }],
    ['findOneAndUpdate', async () => {
        await simpleStorage.findOneAndUpdate()
    }, async () => {
        await simpleStorage.findOneAndUpdateWithError()
    }],
    ['updateOne', async () => {
        await simpleStorage.updateOne()
    }, async () => {
        await simpleStorage.updateOneWithError()
    }],
    ['aggregate', async () => {
        await simpleStorage.aggregate()
    }, async () => {
        await simpleStorage.aggregateWithError()
    }],
    ['updateMany', async () => {
        await simpleStorage.updateMany()
    }, async () => {
        await simpleStorage.updateManyWithError()
    }],
    ['countDocuments', async () => {
        await simpleStorage.countDocuments()
    }, async () => {
        await simpleStorage.countDocumentsWithError()
    }]

])('on', (methodName, methodSucces, methodWithError) => {

    let logStream: LogsStreamInMemory;
    let dateSimulator: DateSimulator;

    const storageBuilder = new StorageRealBuilder<SimpleStorage>((mongoClient) => new SimpleStorage(new MongoClientWithLog(mongoClient!)))


    beforeEach(async () => {
        logStream = new LogsStreamInMemory();
        LoggerAdapter.logStream = logStream;
        dateSimulator = new DateSimulator();
        simpleStorage = await storageBuilder.build();
    })

    afterEach(async () => {
        await storageBuilder.close();
    })


    test(`${methodName}, log Call MongoDB info detail`, async () => {
        await methodSucces()

        expect(logStream.logs[0].msg).toEqual('Call MongoDB')
        expect(logStream.logs[0].log_type).toEqual('partner')
        expect(logStream.logs[0].partner_id).toEqual('MongoDB')
        expect(logStream.logs[0].partnerReq).toEqual({
            "collection": "aCollection",
            "method": methodName,
        })
    })

    test(`${methodName}, log MongoDB response with detail`, async () => {
        await methodSucces()

        expect(logStream.logs[1].msg).toEqual('MongoDB response')
        expect(logStream.logs[1].log_type).toEqual('partner')
        expect(logStream.logs[1].partner_id).toEqual('MongoDB')
        expect(logStream.logs[1].partnerReq).toEqual({
            "collection": "aCollection",
            "method": methodName,
            "response_time": 0,
            "status": "OK",
        })
    })

    test(`${methodName} error, log MongoDB response with detail`, async () => {
        try {
            await methodWithError()
        } catch {
        }

        expect(logStream.logs[1].msg).toMatch(/^MongoDB error : /)
        expect(logStream.logs[1].log_type).toEqual('partner')
        expect(logStream.logs[1].partner_id).toEqual('MongoDB')
        expect(logStream.logs[1].partnerReq).toEqual({
            "collection": "aCollection",
            "method": methodName,
            "response_time": 0,
            "status": "KO",
        })
    })

})
