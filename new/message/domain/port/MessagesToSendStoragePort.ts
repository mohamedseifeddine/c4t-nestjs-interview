import { SendingMessage } from "../model/SendingMessage";
import { MessageToSendStored } from "../model/MessageToSendStored";

export abstract class MessagesToSendStoragePort {
    abstract saveMessageToSend(message: SendingMessage, messageId: string): Promise<any>;
    abstract saveMessageToRetry(message: SendingMessage, messageId: string): Promise<any>;
    abstract message(messageId:string): Promise<MessageToSendStored>;
    abstract stakedMessagesToSend(): Promise<Array<MessageToSendStored>>
}
