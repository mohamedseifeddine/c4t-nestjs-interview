import { DailyQuotaStoragePort } from "../quota/DailyQuotaStoragePort";
import { MonthlyQuotaStoragePort } from "../quota/MonthlyQuotaStoragePort";
import { ReplySessionsStorage } from "../replySession/storageAdapter/ReplySessionStorage";
import { MongoClientWithLog } from "../storage/MongoClientWithLog";
import { UserStoragePort } from "../User/UserStoragePort";
import { PaddockAdapter } from "./adapters/PaddockAdapter/PaddockAdapter";
import { OkapiAdapter } from "./adapters/PnsAdapter/OkapiAdapter/OkapiAdapter";
import { PnsAdapter } from "./adapters/PnsAdapter/PnsAdapter";
import { ShortCodeConfigBuilder } from "./adapters/ShortCodeConfigBuilder";
import { BlackListedRecipientStorage } from "./adapters/storageAdapter/BlackListedRecipientStorage";
import MessageStorage from "./adapters/storageAdapter/MessageStorage";
import { MessagesToSendStorage } from "./adapters/storageAdapter/MessagesToSendStorage";
import { NotificationService } from "./application/NotificationService";
import ConversationService from "./domain/service/ConversationService";
import { XmsBrockerAcknowledgementService } from "./domain/service/XmsBrockerAcknowledgementService";
import { XmsBrockerReplyService } from "./domain/service/XmsBrockerReplyService";
import ConversationRouter from "./router/ConversationRouter";
import { MessagesRouter } from "./router/MessagesRouter";
import { XmsBrockerRouter } from "./router/XmsBrockerRouter";

export class MessageModule {
  static initConversationRouter(
    mongoClientWithLog: MongoClientWithLog,
    userStorage: UserStoragePort
  ) {
    const messageStorage = new MessageStorage(mongoClientWithLog);
    const okapiAdapter = new OkapiAdapter();
    const pnsPartnerAdapter = new PnsAdapter();
    const notificationService = new NotificationService(
      pnsPartnerAdapter,
      okapiAdapter
    );
    const conversationService = new ConversationService(
      messageStorage,
      userStorage,
      notificationService
    );
    return new ConversationRouter(conversationService).router;
  }
  static initMessageRouter(mongoClientWithLog: MongoClientWithLog,userStorage: UserStoragePort,
    dailyQuotaStorage:DailyQuotaStoragePort,monthlyQuotaStorage:MonthlyQuotaStoragePort ){
    const messageStorage = new MessageStorage(mongoClientWithLog);
    const messagesToSendStorage = new MessagesToSendStorage(mongoClientWithLog)
    const blackListedRecipientStorage = new BlackListedRecipientStorage(mongoClientWithLog);
    const paddockAdapter = new PaddockAdapter();
    const replySessionsStorage = new ReplySessionsStorage(mongoClientWithLog);
    const shortCodeConfig = ShortCodeConfigBuilder.loadShortCode()

    return new MessagesRouter(messageStorage, messagesToSendStorage,userStorage,blackListedRecipientStorage,
        paddockAdapter, monthlyQuotaStorage, dailyQuotaStorage,shortCodeConfig,replySessionsStorage).router
  }
  static initXmsBrockerRouter(mongoClientWithLog: MongoClientWithLog,userStorage: UserStoragePort){
    const shortCodeConfig = ShortCodeConfigBuilder.loadShortCode()
    const paddockAdapter = new PaddockAdapter();
    const replySessionsStorage = new ReplySessionsStorage(mongoClientWithLog);
    const blackListedRecipientStorage = new BlackListedRecipientStorage(mongoClientWithLog);
    const messageStorage = new MessageStorage(mongoClientWithLog);
    const xmsBrockerReplyService = new XmsBrockerReplyService(shortCodeConfig, paddockAdapter, replySessionsStorage, blackListedRecipientStorage,
       userStorage, messageStorage)

    return new XmsBrockerRouter(new XmsBrockerAcknowledgementService(messageStorage), xmsBrockerReplyService).router
  }
}