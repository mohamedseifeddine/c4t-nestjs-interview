import { SessionInfo } from "../../../globalMiddlewares/SessionInfo";
import { LoggerAdapter } from "../../../logger/LoggerAdapter";
import { UserStoragePort } from "../../../User/UserStoragePort";
import Conversation from "../../adapters/storageAdapter/Conversation";
import { INotificationService } from "../../application/INotificationService";
import { ConversationNotFoundError } from "../../Errors/ConversationNotfound";
import { ResourceNotFoundError } from "../../Errors/ResourceNotFoundError";
import { SessionInfoDto } from "../../types/types";
import { MessageConversation } from "../model/messageConversation";
import { SendingMessageParser } from "../parser/SendingMessageParser";
import { ConversationServicePort } from "../port/ConversationServicePort";
import { MessageStoragePort } from "../port/MessageStoragePort";

export default class ConversationService implements ConversationServicePort {
    private logger = new LoggerAdapter(ConversationService);

    constructor(private readonly messageStorage: MessageStoragePort,private readonly userStorage: UserStoragePort, private readonly notificationService: INotificationService) {
    }

    async listConversations(uid: string): Promise<Conversation[]> {
        const user = await this.userStorage.userByIse(uid)
        this.logger.debug(`Call listConversations with userId: ${user.id}`)
        const listConversations = await this.messageStorage.conversations(user.id);
        this.logger.debug(`conversations size: ${listConversations.length}`)
        return listConversations;
    }
    async getMessagesOfConversation(conversationId:string,uid:string): Promise<MessageConversation[]> {
        const user = await this.userStorage.userByIse(uid)
        const storedMessages = await this.messageStorage.messagesOfConversation(user.id, conversationId);
        return storedMessages.map(SendingMessageParser.mapMessageStoredToConversation)   
    }

    async deleteConversationById(conversationId: string, uid: string): Promise<void> {
        try {
            const user = await this.userStorage.userByIse(uid)
            return await this.messageStorage.deleteConversation(user.id, conversationId)
        } catch (error) {
            // to check with ddd principes because ResourceNotFoundError is technical error comming from the storage
            if(error instanceof ResourceNotFoundError ){
                throw new ConversationNotFoundError(conversationId)
            }
            throw error
        }
    }
    async getConversationById(uid:string, conversationId: string): Promise<Conversation> {
        try {
            const user = await this.userStorage.userByIse(uid)
            const conversation= await this.messageStorage.conversation(user.id, conversationId);
            return conversation;
        } catch (error) {
            if(error instanceof ResourceNotFoundError ){
                throw new ConversationNotFoundError(conversationId)
            }
            throw error
        }
    }

    async markAsReadConversation(userId: string, conversationId: string): Promise<void> {
        const sessionInfoDto: SessionInfoDto = SessionInfo.reqDto()
        const unreadSms = await this.messageStorage.countUnreadedMessages(userId);
        await this.messageStorage.markAsReadConversation(userId,conversationId);
        await this.userStorage.updateLastActivityDateToNow(userId)
        await this.notificationService.notifyUnread(sessionInfoDto, userId,unreadSms);
    }
}
