import mongoose, {Schema} from "mongoose";
import { DateProvider } from "../../../date-provider/DateProvider";
import { MongoClientWithLog } from "../../../storage/MongoClientWithLog";
import { MongoModelWithLog } from "../../../storage/MongoModelWithLog";
import { BlackListedRecipientStoragePort } from "../../domain/port/BlackListedRecipientStoragePort";
import { BlackListedRecipientStored } from "../../domain/model/BlackListedRecipientStored";


export class BlackListedRecipientStorage extends BlackListedRecipientStoragePort {
    blackListedRecipientsModel: MongoModelWithLog;

    constructor(mongoClient: MongoClientWithLog) {
        super();
        this.blackListedRecipientsModel = mongoClient.model('blackListedRecipients',
            new mongoose.Schema({
                user: Schema.Types.ObjectId,
                msisdn: String,
                ctime: Date,
                mtime: Date
            }))
    }
    async isBlackListed(recipientNumber: string, userId: string) {
        const findBlackListedRecipient = await this.blackListedRecipientsModel.findOne({ msisdn: recipientNumber, user: userId });
        return findBlackListedRecipient !== null;
    }

    async addBlaklistedRecipientForUser(recipientNumber: string, userId: string): Promise<void> {
        await this.blackListedRecipientsModel.updateOne({
            msisdn: recipientNumber,
            user: userId
        }, {
            $setOnInsert: {
                msisdn: recipientNumber,
                user: userId,
                ctime: DateProvider.now()
            },
            $set: { mtime: DateProvider.now() }
        },
            { upsert: true });
    }
    async removeBlacklistedRecipientForUser(recipientNumber: string, userId: string): Promise<void>{
       await this.blackListedRecipientsModel.deleteOne({
            msisdn: recipientNumber,
            user: userId
        });
    }

    async getBlackListedRecipientForTest(recipientNumber: string, userId: string) {
        const findBlackListedRecipient = await this.blackListedRecipientsModel.findOne({ msisdn: recipientNumber, user: userId });
        return findBlackListedRecipient
    }
}
