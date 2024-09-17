import mongoose, {Schema} from "mongoose";
import {DateProvider} from "../../../date-provider/DateProvider";
import {MongoClientWithLog} from "../../../storage/MongoClientWithLog";
import {MongoModelWithLog} from "../../../storage/MongoModelWithLog";
import {SendingMessage} from "../../domain/model/SendingMessage";
import {MessageToSendStored} from "../../domain/model/MessageToSendStored";
import {MessagesToSendStoragePort} from "../../domain/port/MessagesToSendStoragePort";
import {MessageNotFoundError} from "../../Errors/MessageNotFoundError";


export class MessagesToSendStorage extends MessagesToSendStoragePort {
    messagesToSendStorageModel: MongoModelWithLog;

    constructor(mongoClient: MongoClientWithLog) {
        super();
        this.messagesToSendStorageModel = mongoClient.model('xmsStack',
            new mongoose.Schema({
                message: Schema.Types.ObjectId,
                requestedSendingDate: String,
                status: String,
                ack: Boolean,
                tries: {
                    type: Number,
                    default: 0,
                },
                ctime: Date,
                mtime: Date
            })
        )
    }

    async saveMessageToSend(message: SendingMessage, messageId: string): Promise<any> {
        try {
            const MessageToSend = await this.messagesToSendStorageModel.create({
                message: messageId,
                requestedSendingDate: message.deferredDate,
                status: message.status,
                ack: message.deferredAck,
                ctime: DateProvider.now(),
                mtime: DateProvider.now(),

            })

            return this.mapToMessageToSendStored(MessageToSend);
        } catch (error) {
            console.error("Erreur lors de la création du message :", error);
            throw error;
        }
    }

    async saveMessageToRetry(message: SendingMessage, messageId: string): Promise<any> {
        try {

            const MessageToRetry = await this.messagesToSendStorageModel.create({
                message: messageId,
                requestedSendingDate: message.deferredDate,
                status: message.status,
                ack: message.deferredAck,
                tries: 1,
                ctime: DateProvider.now(),
                mtime: DateProvider.now(),

            });
            return this.mapToMessageToSendStored(MessageToRetry);
        } catch (error) {
            console.error("Erreur lors de la création du message :", error);
            throw error;
        }
    }

    async message(messageId: string): Promise<MessageToSendStored> {
        const findmessagesToSendStorageModel = await this.messagesToSendStorageModel.findOne({message: messageId});
        this.checkMessageFound(findmessagesToSendStorageModel);
        return this.mapToMessageToSendStored(findmessagesToSendStorageModel);
    }

    async stakedMessagesToSend() {
        const stackedMessages = await this.messagesToSendStorageModel.find({});
        /*
        {
            requestedSendingDate: {
                $lte: new Date()
            },
            status: 'todo',
            tries: {
                $lte: ctx.jobConf.maxRetries
            }
         */
        return stackedMessages.map(
            (stackedMessage: any) => {
                return this.mapToMessageToSendStored(stackedMessage);
            })
    }

    private mapToMessageToSendStored(findMessageModel: any) {
        return new MessageToSendStored(
            findMessageModel.message,
            findMessageModel.requestedSendingDate,
            findMessageModel.status,
            findMessageModel.ack,
            findMessageModel.tries,
            findMessageModel.ctime,
            findMessageModel.mtime,
        );
    }

    private checkMessageFound(result: any) {
        if (result === null) {
            throw new MessageNotFoundError();
        }
    }
}
