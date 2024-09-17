import Conversation from "../../adapters/storageAdapter/Conversation";
import { SendingMessage } from "../model/SendingMessage";
import { MessageStored } from "../model/MessageStored";
import {Message} from "../model/Message";
import {MultiPacketsReceivedMessage} from "../model/MultiPacketsReceivedMessage";


export abstract class MessageStoragePort {
    abstract storeMessage(message: Message, userId: string): Promise<MessageStored>;
    abstract flagAsDeleted(messageId:string, userId:string): Promise<void>;
    abstract messages(userId: string): Promise<MessageStored[]>;
    abstract updateSendingMessageOnSuccess(userId:string, messageId:string, hubMessageId:string): Promise<any>
    abstract updateSendingMessageOnFailure(userId:string, messageId:string, errorCode:string): Promise<any>
    abstract updateSentMessageReceivedOnSuccess(id: string) : Promise<void>
    abstract updateSentMessageReceivedOnError(id: string, error: string) : Promise<void>
    abstract conversations(userId:string): Promise<Conversation[]>
    abstract markMessageAsRead(userId: string, messageId: string): Promise<void>;
    abstract conversation(userId: string, conversationId: string): Promise<Conversation>;
    abstract messagesOfConversation(userId: string, conversationId: string): Promise<MessageStored[]>;
    abstract deleteConversation(userId: string, conversationId: string): Promise<void>;
    abstract markAsReadConversation(userId: string, conversationId: string):Promise<void>
    abstract messageByHubMessageId(hubMessageId: string) :Promise<MessageStored>
    abstract countUnreadedMessages(userId:string):Promise<number>
    abstract storeMultiPacketsReceivedMessages(userId:string, multiPacketsReceivedMessage: MultiPacketsReceivedMessage):Promise<void>
}
