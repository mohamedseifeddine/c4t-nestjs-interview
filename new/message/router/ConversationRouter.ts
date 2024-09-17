import express, {
  json,
  NextFunction,
  Request,
  Response,
  Router,
} from "express";
import { EncryptedTokenMiddleware } from "../../globalMiddlewares/EncryptedTokenMiddleware";
import { ConversationServicePort } from "../domain/port/ConversationServicePort";
import { MessageErrorMiddleware } from "./MessagesRouter";

export default class ConversationRouter{
    public readonly router: Router;
    public static readonly BASE_URI = "/users/:userId/conversations"
  constructor(private readonly conversationService: ConversationServicePort) {
    this.router = express.Router();
    this.router.use(json()); //use json() for read body
    this.router.use(EncryptedTokenMiddleware.middleware);
    this.router.get(ConversationRouter.BASE_URI, this.listConversations.bind(this));
    this.router.get(`${ConversationRouter.BASE_URI}/:conversationId/messages`, this.getMessagesOfConversation.bind(this));
    this.router.get(`${ConversationRouter.BASE_URI}/:conversationId`, this.getConversationById.bind(this));
    this.router.delete(`${ConversationRouter.BASE_URI}/:conversationId`, this.deleteConversation.bind(this));
    this.router.put(`${ConversationRouter.BASE_URI}/:conversationId`, this.markConversationAsRead.bind(this));
    this.router.use(MessageErrorMiddleware.middleware);
  }

  private async listConversations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const conversationsList = await this.conversationService.listConversations(req.encryptedToken.uid());
      res.status(200).send(conversationsList);
    } catch (e) {
      next(e);
    }
  }

  private async getMessagesOfConversation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {conversationId} = req.params
      const conversationsList = await this.conversationService.getMessagesOfConversation(conversationId,req.encryptedToken.uid());
      res.status(200).send(conversationsList);
    } catch (e) {
      next(e);
    }
  }

  private async getConversationById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {conversationId} = req.params
      const conversation = await this.conversationService.getConversationById(
        req.encryptedToken.uid(),
        conversationId
      );
      res.status(200).send(conversation);
    } catch (e) {
      console.log("getConversationById error: ",e);

      next(e);
    }
  }

  private async deleteConversation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {conversationId} = req.params
      await this.conversationService.deleteConversationById(
        conversationId,
        req.encryptedToken.uid()
      );
      res.sendStatus(204);
    } catch (e) {
      next(e);
    }
  }
  private async markConversationAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {conversationId} = req.params
      const userid = req.encryptedToken.uid()
      await this.conversationService.markAsReadConversation(
        userid,
        conversationId
      );
      res.sendStatus(204);
    } catch (e) {
      next(e);
    }
  }
}
