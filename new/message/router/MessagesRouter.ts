import express, {
  json,
  NextFunction,
  Request,
  Response,
  Router,
} from "express";
import { DomainError } from "../../Error/DomainError";
import { EncryptedTokenMiddleware } from "../../globalMiddlewares/EncryptedTokenMiddleware";
import { HttpError } from "../../httpCall/HttpError";
import { LoggerAdapter } from "../../logger/LoggerAdapter";
import { DailyQuotaStoragePort } from "../../quota/DailyQuotaStoragePort";
import { MonthlyQuotaStoragePort } from "../../quota/MonthlyQuotaStoragePort";
import { ReplySessionsStoragePort } from "../../replySession/ReplySessionsStoragePort";
import { UserStoragePort } from "../../User/UserStoragePort";
import { ShortCodeConfig } from "../adapters/ShortCodeConfigBuilder";
import { BlackListedRecipientStoragePort } from "../domain/port/BlackListedRecipientStoragePort";
import { MessageStoragePort } from "../domain/port/MessageStoragePort";
import { MessagesToSendStoragePort } from "../domain/port/MessagesToSendStoragePort";
import { PaddockAdapterPort } from "../domain/port/PaddockAdapterPort";
import { MessagesService } from "../domain/service/MessagesService";
import { MessageErrorMapper } from "../Errors/MessageErrorMapper";

export class MessageErrorMiddleware {
  
  static middleware(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    
    if (err instanceof DomainError) {
      const httpError = new MessageErrorMapper().mapDomainErrorToHttpError(err);
      return res.status(httpError.status).send({
        mnemo: httpError.mnemo,
        message: httpError.message,
      });
    } else if (err instanceof HttpError){
      return res.status(err.status).send({
        mnemo: err.mnemo,
        message: err.message,
      });
    } else {
      next(err);
    }
  }
}

export class MessagesRouter {
  public readonly router: Router;
  public messageService: MessagesService;

  constructor(
    messageStorage: MessageStoragePort,
    messageToSendStorage: MessagesToSendStoragePort,
    userStorage: UserStoragePort,
    blackListedStorage: BlackListedRecipientStoragePort,
    paddockAdapter: PaddockAdapterPort,
    monthlyQuotaStorage: MonthlyQuotaStoragePort,
    dailyQuotaStorage: DailyQuotaStoragePort,
    shortCodeConfig: ShortCodeConfig,
    replySessionsStorage: ReplySessionsStoragePort
  ) {
    this.messageService = new MessagesService(
      messageStorage,
      messageToSendStorage,
      paddockAdapter,
      blackListedStorage,
      userStorage,
      monthlyQuotaStorage,
      dailyQuotaStorage,
      shortCodeConfig,
      replySessionsStorage
    );
    this.router = express.Router();
    this.router.use(json()); //use json() for read body
    this.router.use(EncryptedTokenMiddleware.middleware);
    this.router.post("/users/:userId/messages", this.postMessage.bind(this));
    this.router.delete(
      "/users/:userId/messages/:messageId",
      this.deleteMessage.bind(this)
    );
    this.router.use(MessageErrorMiddleware.middleware);
  }

  private async postMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const messageToSend = {
        destinationPhoneNumbers: req.body.recipients,
        deferredDate: req.body.deferredDate,
        deferredAck: req.body.deferredAck,
        subject: req.body.subject,
        replyType: req.body.replyType,
        replyNotification: req.body.replyNotification,
        content: req.body.content,
        messageHeader: req.body.messageHeader ?? "",
      };
      const logger = new LoggerAdapter(MessagesRouter);
      const msgToSend = JSON.stringify(messageToSend);
      logger.info(`XXXXX messageToSend in the routeer ${msgToSend}`);
      const messageInfos = await this.messageService.sendSms(
        messageToSend,
        true,
        req.encryptedToken.uid()
      );
      res.status(200).send(messageInfos);
    } catch (e) {
      next(e);
    }
  }

  private async deleteMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await this.messageService.deleteMessageById(
        req.params.messageId,
        req.encryptedToken.uid()
      );
      res.sendStatus(204);
    } catch (e) {
      next(e);
    }
  }
}
