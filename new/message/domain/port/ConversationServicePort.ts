import Conversation from "../../adapters/storageAdapter/Conversation";
import { MessageConversation } from "../model/messageConversation";

export interface ConversationServicePort {
  listConversations(uid: string): Promise<Conversation[]>;
  getMessagesOfConversation(
    conversationId: string,
    uid: string
  ): Promise<MessageConversation[]>;
  getConversationById(
    uid: string,
    conversationId: string
  ): Promise<Conversation>;
  deleteConversationById(conversationId: string, uid: string): Promise<void>;
  markAsReadConversation(userId: string, conversationId: string): Promise<void>;
}
