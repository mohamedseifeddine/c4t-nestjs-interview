/*
utilisé par la Conversion Mayer (CL)
en Post
/users/me/messages

==> sendMessage dans MessageController

body.ack
body.deferred
msgToSend.replyType

controle des formats de numéro de téléphone : BadMsisdnError
ReplyNotifUnavailableError
RequiredContentError
SmsTooLongError

DoSEnd
then
// If it's a pro user, insert the XMS in the outbox of the user's mail box

create output for caller - extractMessageData
attention, nettoyer les champs inutiles


même controle que /users
if (!user) {
    throw new BadTokenError();
}

if (userId && userId !== 'me' && userId !== user.id) {
    // The given userId doesn't match the one authenticated by token (hence by wassup cookie)
    throw new BadUserIdError();
}


si from cl =
    const fromCL = req.getParam('header', 'x-cl-auth') === conf.conversionLayer.authKey;

    pas de controle    user.termsAccepted
    pas de controle     pincode


le post users/me/messages est soumis au LockedAccountError
 */
import cookieParser from "cookie-parser";
import express, { Express } from "express";
import request from "supertest";
import { Token } from "../../Token/Token";
import { UserStorageInMemory } from "../../User/storageAdapter/UserStorageInMemory";
import { FormatRequestMiddleware } from "../../globalMiddlewares/FormatRequestMiddleware";
import { SessionInfoStartMiddleware } from "../../globalMiddlewares/SessionInfoStartMiddleware";
import { DailyQuotaStorageInMemory } from "../../quota/storageAdapter/DailyQuotaStorageInMemory";
import { MonthlyQuotaStorageInMemory } from "../../quota/storageAdapter/MonthlyQuotaStorageInMemory";
import { ReplySessionStorageInMemory } from "../../replySession/storageAdapter/ReplySessionStorageInMemory";
import { PaddockAdapterInMemory } from "../adapters/PaddockAdapter/PaddockAdapterInMemory";
import { ShortCodeConfig } from "../adapters/ShortCodeConfigBuilder";
import { BlackListedRecipientStorageInMemory } from "../adapters/storageAdapter/BlackListedRecipientStorageInMemory";
import { MessageStorageInMemory } from "../adapters/storageAdapter/MessageStorageInMemory";
import { MessagesToSendStorageInMemory } from "../adapters/storageAdapter/MessagesToSendStorageInMemory";
import { SendingMessageBuilder } from "../domain/model/SendingMessageBuilder";
import { ShortCodeInternational } from "../domain/model/ShortCodeInternational";
import { ShortCodeNoReply } from "../domain/model/ShortCodeNoReply";
import { ShortCodeReplyable } from "../domain/model/ShortCodeReplyable";
import { MessagesRouter } from "./MessagesRouter";
import {SessionInfoMiddleware} from "../../globalMiddlewares/SessionInfoMiddleware";

async function createUserInStorage(userStorage: UserStorageInMemory, ise: string) {
    await userStorage.createUserIfNotExist(ise, 60, 1, "aPuid", 'bidule@machin.com');
}

describe("Message Router", () => {
    const ise = "aIse";

    let app: Express;
    let messageRouter: MessagesRouter;
    let messageStorage: MessageStorageInMemory;
    let userStorage: UserStorageInMemory;
    let messageToSendStorage: MessagesToSendStorageInMemory;

    beforeEach(() => {
        messageStorage = new MessageStorageInMemory();
        messageToSendStorage = new MessagesToSendStorageInMemory();
        userStorage = new UserStorageInMemory();
        let paddockAdapterInMemory = new PaddockAdapterInMemory();
        let blackListedStorage = new BlackListedRecipientStorageInMemory();
        let monthlyQuotaStorage = new MonthlyQuotaStorageInMemory();
        let dailyQuotaStorage = new DailyQuotaStorageInMemory();
        let shortCodeConfig = new ShortCodeConfig(
            new ShortCodeNoReply("aNoReplySenderadress", ["10000"], "noReplyOdiAuthorization-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
            new ShortCodeInternational("aInterSenderadress", ["20000"], "interOdiAuthorization-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
            [
                new ShortCodeReplyable("aReplyableSenderadress0", ["30000"], "ReplyableOdiAuthorization0-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
            ]
        )
        let replySessionsStorage= new ReplySessionStorageInMemory()


        messageRouter = new MessagesRouter(
            messageStorage,
            messageToSendStorage,
            userStorage,
            blackListedStorage,
            paddockAdapterInMemory,
            monthlyQuotaStorage,
            dailyQuotaStorage,
            shortCodeConfig,
            replySessionsStorage
        );
        app = express();
        app.use(cookieParser());
        app.use(new SessionInfoStartMiddleware().middleware);
        app.use(new FormatRequestMiddleware().middleware);
        app.use(new SessionInfoMiddleware().middleware);
        app.use(messageRouter.router);
    });


    describe.each([
        ["patch", (param: string) => request(app!).patch(param)],
        ["delete", (param: string) => request(app!).delete(param)],
    ])("Errors cases for method %s", (methodeName, method) => {
        test(`${methodeName} /message return error 401 when authorization header is missing`, async () => {
            const response = await method("/user/me/messages/50");

            expect(response.status).toEqual(401);
            expect(response.body.mnemo).toEqual("MISSING_AUTHORIZATION_BEARER");
            expect(response.body.message).toEqual(
                "Authorization bearer is missing and required for authentication"
            );
        });
    });

    test("Delete /user/userId/messages/messageId path return 404 not found message when message does not exists", async () => {
        await createUserInStorage(userStorage, ise);

        const response = await request(app)
            .delete(`/users/me/messages/notFoundMessageId`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            mnemo: "RESOURCE_NOT_FOUND",
            message: "Message not found",
        });
    });

    test("Delete /user/userId/messages/messageId path return 404 not found message when message is already deleted", async () => {
        await createUserInStorage(userStorage, ise);
        const user = await userStorage.userByIse(ise);
        const messageId = (
            await messageStorage.storeMessage(
                new SendingMessageBuilder().withContent("aMessage1").build(),
                user.id
            )
        ).id;
        await request(app)
            .delete(`/users/me/messages/${messageId}`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        const response = await request(app)
            .delete(`/users/me/messages/${messageId}`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            mnemo: "RESOURCE_NOT_FOUND",
            message: "Message not found",
        });

    });

    test("Delete /user/userId/messages/messageId path return 204 when message is deleted successfully", async () => {
        await createUserInStorage(userStorage, ise);
        const user = await userStorage.userByIse(ise);
        const messageId = (
            await messageStorage.storeMessage(
                new SendingMessageBuilder().withContent("aMessage1").build(),
                user.id
            )
        ).id;

        const response = await request(app)
            .delete(`/users/me/messages/${messageId}`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(204);
        expect(response.body).toEqual({})
    });

});
