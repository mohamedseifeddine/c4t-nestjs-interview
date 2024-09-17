import {DailyQuotaStoragePort} from "../DailyQuotaStoragePort";
import mongoose, {Schema} from "mongoose";
import {DateProvider} from "../../date-provider/DateProvider";
import {MongoModelWithLog} from "../../storage/MongoModelWithLog";
import {MongoClientWithLog} from "../../storage/MongoClientWithLog";

export class DailyQuotaStorage implements DailyQuotaStoragePort {

    private dailyQuotaModel: MongoModelWithLog


    constructor(mongoClient: MongoClientWithLog) {
        this.dailyQuotaModel = mongoClient.model('dailyQuota',
            new mongoose.Schema({
                user: Schema.Types.ObjectId,
                sentSms: Number,
                sentMms: Number,
                freeSmsLeft: Number,
                freeMmsLeft: Number,
                ctime: Date,
                //  mtime: Date,
            })
        )
    }

    async sentSmsForUser(userId: string) {
        await this.createQuotaOrResetOnExpiration(userId);
        const dailyQuota = await this.dailyQuotaModel.findOne(
            {user: userId});
        return dailyQuota.sentSms
    }

    async incrementSentSmsForUser(userId: string, inc: number = 1) {
        await this.createQuotaOrResetOnExpiration(userId);
        await this.dailyQuotaModel.findOneAndUpdate(
            {user: userId},
            {
                $inc: {
                    sentSms: inc
                }
            })
    }

    private async createQuotaOrResetOnExpiration(userId: string) {
        const dayliQuota = await this.dailyQuotaModel.findOneAndUpdate(
            {user: userId},
            {
                $setOnInsert: {
                    user: userId,
                    ctime: DateProvider.now(),
                    sentSms: 0,
                    sentMms: 0,  // pour compatibilité
                    freeSmsLeft: 20,  // pour compatibilité
                    freeMmsLeft: 20,  // pour compatibilité
                }
            },
            {upsert: true, returnOriginal: false});

        const _24hourBeforeNow = DateProvider.now().getTime() - 24 * 60 * 60 * 1000;
        if (dayliQuota.ctime.getTime() < _24hourBeforeNow) {
            await this.dailyQuotaModel.updateOne(
                {user: userId},
                {
                    ctime: DateProvider.now(),
                    sentSms: 0,
                    sentMms: 0,  // pour compatibilité
                    freeSmsLeft: 20,  // pour compatibilité
                    freeMmsLeft: 20,  // pour compatibilité
                }
            )
        }
    }
}
