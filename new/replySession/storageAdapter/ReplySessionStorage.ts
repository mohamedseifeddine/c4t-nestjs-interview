import mongoose, {Schema} from "mongoose";
import {DateProvider} from "../../date-provider/DateProvider";
import {MessageStored} from "../../message/domain/model/MessageStored";
import {MongoClientWithLog} from "../../storage/MongoClientWithLog";
import {MongoModelWithLog} from "../../storage/MongoModelWithLog";
import {ReplySessionConflictError} from "../Errors/ReplySessionConflictError";
import {ReplySessionsNotFoundInStorageError} from "../Errors/ReplySessionsNotFoundInStorageError";
import {ReplySessionsStoragePort} from "../ReplySessionsStoragePort";
import {ReplySessionsStored} from "../ReplySessionsStored";
import {DateTime} from "luxon";
import {Invalid, Valid} from "luxon/src/_util";


// TODO
//deleteOne reply Sessions as Admin
//deleteMany replySessions for worker and when deleting user
// search ReplySessionList as Admin

const replySessionLifetime = 3; // 7 days

export class ReplySessionsStorage extends ReplySessionsStoragePort {
    replySessionsModel: MongoModelWithLog;

    constructor(mongoClient: MongoClientWithLog) {
        super();
        this.replySessionsModel = mongoClient.model(
            'replySessions',
            new mongoose.Schema({
                virtualShortCodeId: String,
                message: Schema.Types.ObjectId,
                recipient: String,
                user: Schema.Types.ObjectId,
                notification: Boolean,
                ctime: Date,
                mtime: Date
            }))
    }


    async createReplySessions(virtualShortCodeId: string, message: MessageStored): Promise<void> {
        const now = DateTime.fromJSDate(DateProvider.now());
            const existingSession = await this.findAndResetOnExpirationReplySessions(virtualShortCodeId, message.recipient);
            if(existingSession !== undefined){
                throw new ReplySessionConflictError(virtualShortCodeId, message.recipient);
            }
            await this.replySessionsModel.create(
                {
                    virtualShortCodeId: virtualShortCodeId,
                    message: message.id,
                    recipient: message.recipient,
                    user: message.user,
                    notification: message.replyNotification,
                    ctime: now.toJSDate(),
                    mtime: now.toJSDate()
                }
            );
    }

    async replySessions(virtualShortCodeId: string, recipient: string): Promise<ReplySessionsStored> {
        const existingSession = await this.findAndResetOnExpirationReplySessions(virtualShortCodeId, recipient);

        if (existingSession === undefined) {
            throw new ReplySessionsNotFoundInStorageError(virtualShortCodeId, recipient);
        }

        return existingSession;
    }

    async findAndResetOnExpirationReplySessions(virtualShortCodeId: string, recipient: string): Promise<any> {
        const now = DateTime.fromJSDate(DateProvider.now());

        const replySession = await this.replySessionsModel.findOne({
            virtualShortCodeId: virtualShortCodeId,
            recipient: recipient
        });

        if (replySession) {
           if (this.isExpirateReplySession(now, replySession.ctime, replySessionLifetime)) {
                await this.replySessionsModel.deleteOne({
                    virtualShortCodeId: virtualShortCodeId,
                    recipient: recipient
                });
            }else{
                return replySession
            }
        }
    }

    private isExpirateReplySession(now: DateTime<Valid> | DateTime<Invalid>, ctime: Date, replySessionLifetime: number) {
        const sessionCtime = DateTime.fromJSDate(ctime);
        return now.diff(sessionCtime, "days").days > replySessionLifetime;
    }
}
