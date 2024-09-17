import {DateTime} from 'luxon';
import {MonthlyQuotaStoragePort} from "../MonthlyQuotaStoragePort";
import mongoose, {Schema} from "mongoose";
import {DateProvider} from "../../date-provider/DateProvider";
import {MongoClientWithLog} from "../../storage/MongoClientWithLog";
import {MongoModelWithLog} from "../../storage/MongoModelWithLog";
import {MonthlyQuotaStored} from "../MonthlyQuotaStored";

export class MonthlyQuotaStorage implements MonthlyQuotaStoragePort {

    private monthlyQuotaModel: MongoModelWithLog

    constructor(mongoClient: MongoClientWithLog) {
        this.monthlyQuotaModel = mongoClient.model('monthlyQuota',
            new mongoose.Schema({
                user: Schema.Types.ObjectId,
                sentSms: Number,
                sentMms: Number,
                smsRecipientList: Array,
                ctime: Date,
            })
        )
    }

    async quotaForUser(userId: string) {
        await this.createQuotaOrResetOnExpiration(userId);
        const mongoResponse = await this.monthlyQuotaModel.findOneAndUpdate(
            {user: userId},
            {
                $setOnInsert: {
                    user: userId,
                    sentSms: 0,
                    sentMms: 0,  // pour compatibilité
                }
            },
            {upsert: true, returnOriginal: false});
        return new MonthlyQuotaStored(mongoResponse.sentSms, mongoResponse.smsRecipientList.length)
    }

    async incrementSentSmsForUser(userId: string, inc: number, recipients: Array<string>) {
        await this.createQuotaOrResetOnExpiration(userId);
        await this.monthlyQuotaModel.findOneAndUpdate(
            {user: userId},
            {
                $setOnInsert: {
                    user: userId,
                },
                $inc: {
                    sentSms: inc
                },
                $addToSet: {
                    smsRecipientList: {
                        $each: recipients
                    }
                }
            },
            {upsert: true, returnOriginal: false})
    }

    private async createQuotaOrResetOnExpiration(userId: string) {
        const now = DateTime.fromJSDate(DateProvider.now());

        const monthlyQuota = await this.monthlyQuotaModel.findOneAndUpdate(
            {user: userId},
            {
                $setOnInsert: {
                    user: userId,
                    ctime: now.toJSDate(),
                    sentSms: 0,
                    sentMms: 0,  // pour compatibilité
                    smsRecipientList: [],
                }
            },
            {upsert: true, returnOriginal: false}
        );

        const quotaCtime = DateTime.fromJSDate(monthlyQuota.ctime);


        if (!now.hasSame(quotaCtime, 'month')) {
            await this.monthlyQuotaModel.updateOne(
                {user: userId},
                {
                    ctime: now.toJSDate(),
                    sentSms: 0,
                    sentMms: 0,  // pour compatibilité
                    smsRecipientList: [],
                }
            );
        }
    }

}
