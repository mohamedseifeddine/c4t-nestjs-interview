import { v4 as uuidv4 } from "uuid";
import { DateProvider } from "../../../date-provider/DateProvider";
import { SendingMessage } from "../../domain/model/SendingMessage";
import { MessageToSendStored } from "../../domain/model/MessageToSendStored";
import { MessagesToSendStoragePort } from "../../domain/port/MessagesToSendStoragePort";


class MessageToSendStoredInMemory {

    constructor(public readonly messageStored: MessageToSendStored) {
    }
}

export class MessagesToSendStorageInMemory extends MessagesToSendStoragePort {

    public messagesInMemory: Array<MessageToSendStoredInMemory> = new Array<MessageToSendStoredInMemory>();
    private error: Error | undefined;
    public nextId = uuidv4()

    async saveMessageToSend(message: SendingMessage, messageId: string): Promise<any> {
        if (this.error) {
            throw this.error;
        }
        try {
            const newMessage = new MessageToSendStored(
                messageId,
                message.deferredDate,
                message.status,
                message.deferredAck,
                0,
                DateProvider.now(),
                DateProvider.now(),


            );
            this.messagesInMemory.push(new MessageToSendStoredInMemory(newMessage));
            this.nextId = uuidv4();
            return newMessage;
        } catch (error: any) {
            throw new Error;
        }
    }
    async saveMessageToRetry(message: SendingMessage, messageId: string): Promise<any> {
        if (this.error) {
            throw this.error;
        }
        try {
            const newMessage = new MessageToSendStored(
                messageId,
                message.deferredDate,
                message.status,
                message.deferredAck,
                1,
                DateProvider.now(),
                DateProvider.now(),

            );
            this.messagesInMemory.push(new MessageToSendStoredInMemory(newMessage));
            this.nextId = uuidv4();
            return newMessage;
        } catch (error: any) {
            throw new Error;
        }
    }

    async message(messageId:string) {
        if (this.error) {
            throw this.error;
        }
        const message = this.messagesInMemory
            .filter(msg => msg.messageStored.message===messageId);

        if (message === undefined || message.length===0) {
            throw new Error;
        }
        return message[0].messageStored;
    }

    stakedMessagesToSend(): Promise<Array<MessageToSendStored>> {
        return Promise.resolve(this.messagesInMemory.map(messageInMemoryByUserId=> messageInMemoryByUserId.messageStored));
    }

}
