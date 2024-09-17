import cookieParser from "cookie-parser";
import express, { Express } from "express";
import request from "supertest";
import { Token } from "../../Token/Token";
import { UserStorageInMemory } from "../../User/storageAdapter/UserStorageInMemory";
import { DateSimulator } from "../../date-provider/DateSimulator";
import { FormatRequestMiddleware } from "../../globalMiddlewares/FormatRequestMiddleware";
import { SessionInfoMiddleware } from "../../globalMiddlewares/SessionInfoMiddleware";
import { SessionInfoStartMiddleware } from "../../globalMiddlewares/SessionInfoStartMiddleware";
import { OkapiAdapterInMemory } from "../adapters/PnsAdapter/OkapiAdapter/OkapiAdapterInMemory";
import { PnsAdapterInMemory } from "../adapters/PnsAdapter/PnsAdapterInMemory";
import { MessageStorageInMemory } from "../adapters/storageAdapter/MessageStorageInMemory";
import { INotificationService } from "../application/INotificationService";
import { NotificationService } from "../application/NotificationService";
import { SendingMessageBuilder } from "../domain/model/SendingMessageBuilder";
import { ConversationServicePort } from "../domain/port/ConversationServicePort";
import ConversationService from "../domain/service/ConversationService";
import ConversationRouter from "./ConversationRouter";

async function createUserInStorage(userStorage: UserStorageInMemory, ise: string) {
    await userStorage.createUserIfNotExist(ise, 60, 1, "aPuid", 'bidule@machin.com');
}

describe("Conversation Router",  () => {
    const ise = "aIse";
    const recipientNbr = "+33123456789"
    const recipientNbr2 = "+33123456790"
    const stripId = (arr: { [x: string]: any; id: any; }[]) => arr.map(({ id, ...rest }) => rest);
    const baseUri = ConversationRouter.BASE_URI.replace(':userId',"me")

    let app: Express;
    let conversationRouter: ConversationRouter;
    let messageStorage: MessageStorageInMemory;
    let userStorage: UserStorageInMemory;
    let dateSimulator: DateSimulator;
    let pnsAdapterInMemory:PnsAdapterInMemory
    let notificationService:INotificationService
    let conversationService:ConversationServicePort
    const buildOutBoxMessage = async (recipientNbr:string,messageContent:string)=>{
        const user= await userStorage.userByIse(ise)

        await messageStorage.storeMessage(
            new SendingMessageBuilder().withBox("outbox").withReplyType("inbox").withSize(messageContent.length).withStatus("sent").withDeleted(false).withDestinationPhoneNumber(recipientNbr).withContent(messageContent).build(),
            user.id
        )
    }
    const buildUnreadedInBoxMessage = async (recipientNbr:string,messageContent:string)=>{
        const user= await userStorage.userByIse(ise)
        await messageStorage.storeMessage(
            new SendingMessageBuilder().withBox("inbox").withReplyType("outbox").withSize(messageContent.length).withStatus("sent").withDeleted(false).withDestinationPhoneNumber(recipientNbr).withContent(messageContent).build(),
            user.id
        )
    }

    beforeEach(() => {
        dateSimulator = new DateSimulator();
        messageStorage = new MessageStorageInMemory();
        userStorage = new UserStorageInMemory();
        pnsAdapterInMemory = new PnsAdapterInMemory(new OkapiAdapterInMemory())
        notificationService = new NotificationService(pnsAdapterInMemory,new OkapiAdapterInMemory())
        conversationService = new ConversationService(messageStorage,userStorage,notificationService,)
        conversationRouter = new ConversationRouter(conversationService);

        app = express();
        app.use(cookieParser());
        app.use(new SessionInfoStartMiddleware().middleware);
        app.use(new FormatRequestMiddleware().middleware);
        app.use(new SessionInfoMiddleware().middleware);
        app.use(conversationRouter.router);
    });

    afterEach(async () => {
        dateSimulator.restore()
    })

    test("GET /conversations response contains empty list of conversations when user doenst have any conversation", async ()=>{
        await createUserInStorage(userStorage, ise);

        const response = await request(app)
            .get(baseUri)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    })

    test("GET /conversations response contains 2 elements in the list of conversations when user have 2 conversations", async ()=>{
        await createUserInStorage(userStorage, ise);
        const messageContent = "test message"
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildOutBoxMessage(recipientNbr,messageContent)
        await buildOutBoxMessage(recipientNbr2,messageContent)

        const response = await request(app)
            .get(baseUri)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(200);
        expect(response.body.length).toEqual(2)
        expect(response.body[0]).toHaveProperty("id")
        expect(response.body[1]).toHaveProperty("id")
        expect(stripId(response.body)).toMatchObject([{
            "recipient": recipientNbr,
            "lastMessageContent": messageContent,
            "unread": 0,
            "messagesNumber": 1,
            "smsNumber": 1,
            "ctime": time,
            "mtime": time,
        },{
            "recipient": recipientNbr2,
            "lastMessageContent": messageContent,
            "unread": 0,
            "messagesNumber": 1,
            "smsNumber": 1,
            "ctime": time,
            "mtime": time,
        }]);
    })

    test("GET /conversations response contains messagesNumber 2 when user have two messages in one conversation", async ()=>{
        await createUserInStorage(userStorage, ise);
        const messageContent = "aMessage1"
        const lastMessageContent = "i'am the last message"
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildOutBoxMessage(recipientNbr,messageContent)
        const time2 = '2024-06-28T10:40:00.000Z';
        dateSimulator.dateIs(time2);
        await buildOutBoxMessage(recipientNbr,lastMessageContent)

        const response = await request(app)
            .get(baseUri)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty("id")
        expect(stripId(response.body)).toMatchObject([{
            "recipient": recipientNbr,
            "lastMessageContent": lastMessageContent,
            "unread": 0,
            "messagesNumber": 2,
            "smsNumber": 2,
            "ctime": time,
            "mtime": time2,
        }]);
    })

    test("GET /conversations response contains messagesNumber 2 and unread 1 when user have one inbox message and one outbox message in the conversation", async ()=>{
        await createUserInStorage(userStorage, ise);
        // in the inbox case the recipientNbr must be my number ??
        const messageContent = "aMessage1"
        const lastMessageContent = "i'am the last message from the inbox"
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildOutBoxMessage(recipientNbr,messageContent)
        const time2 = '2024-06-28T10:40:00.000Z';
        dateSimulator.dateIs(time2);
        await buildUnreadedInBoxMessage(recipientNbr,lastMessageContent)

        const response = await request(app)
            .get(baseUri)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty("id")
        expect(stripId(response.body)).toEqual([{
            "recipient": recipientNbr,
            "lastMessageContent": lastMessageContent,
            "unread": 1,
            "messagesNumber": 2,
            "smsNumber": 2,
            "ctime": time,
            "mtime": time2,
        }]);
    })

    test("GET /conversations response should not show marked as deleted messages in conversation list", async () => {
        await createUserInStorage(userStorage, ise);
        const user = await userStorage.userByIse(ise)
        const messageContent = "Message deleted";
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildUnreadedInBoxMessage(recipientNbr,"Outbox Message")
        const time2 = '2024-06-28T10:40:00.000Z';
        dateSimulator.dateIs(time2);
        await messageStorage.storeMessage(
            new SendingMessageBuilder().withDeleted(true).withBox("inbox").withStatus("sent").withDestinationPhoneNumber(recipientNbr).withContent(messageContent).build(),
            user.id
        )

        const response = await request(app)
            .get(baseUri)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.body[0]).toHaveProperty("id")
        expect(response.status).toBe(200);
        expect(response.body.length).toEqual(1);
        expect(response.body[0]).toHaveProperty("id")
        expect(stripId(response.body)).toEqual([{
            "recipient": recipientNbr,
            "lastMessageContent": "Outbox Message",
            "unread": 1,
            "messagesNumber": 1,
            "smsNumber": 1,
            "ctime": time,
            "mtime": time,
        }]);
    });

    test("GET /conversations response contains correctly count of unread inbox messages", async () => {
        await createUserInStorage(userStorage, ise);
        const unreadMessageContent = "Unread message";
        const readMessageContent = "Read message";
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildUnreadedInBoxMessage(recipientNbr, unreadMessageContent);
        const time2 = '2024-06-28T10:40:00.000Z';
        dateSimulator.dateIs(time2);
        await buildOutBoxMessage(recipientNbr, readMessageContent);

        const response = await request(app)
            .get(baseUri)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(200);
        expect(response.body[0].unread).toEqual(1);
    });

    test("GET /conversations/id/messages response return one message correctly when user has send only one message", async ()=>{
        await createUserInStorage(userStorage, ise);
        const conversationIdHex = Buffer.from(recipientNbr, 'utf8').toString('hex');
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildOutBoxMessage(recipientNbr,"Hello")

        const response = await request(app)
            .get(`${baseUri}/${conversationIdHex}/messages`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty("id")
        expect(stripId(response.body)).toEqual([
            {
                "attachments": [],
                "billed": false,
                "billingType": "",
                "box": "outbox",
                "content": "Hello",
                "ctime": "2024-06-28T10:36:00.000Z",
                "deferred": false,
                "deferredAck": false,
                "errorCode": "",
                "messageType": "sms",
                "messagesNumber": 1,
                "mtime": "2024-06-28T10:36:00.000Z",
                "read": false,
                "recipient": recipientNbr,
                "replyNotification": false,
                "replyType": "inbox",
                "sendingDate": "2024-06-28T10:36:00.000Z",
                "size": 5,
                "status": "sent",
                "subject": ""
            }
        ]);
    })

    test("Get /users/:userId/conversations/:conversationId returns conversation information", async () => {
        await createUserInStorage(userStorage, ise);
        const conversationIdHex = Buffer.from(recipientNbr, 'utf8').toString('hex');
        // const user = await userStorage.userByIse(ise);
        // const message = new MessageBuilder().withDestinationPhoneNumber(recipient).withContent("Message").build();
        // await messageStorage.createMessage(message, user.id);
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildOutBoxMessage(recipientNbr,"Hello")

        const response = await request(app)
            .get(`${baseUri}/${conversationIdHex}`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(200);
        expect(response.body.recipient).toEqual(recipientNbr);
        expect(response.body.lastMessageContent).toEqual("Hello");
    });

    test("Get /users/:userId/conversations/:conversationId returns 404 when conversation is not found", async () => {
        await createUserInStorage(userStorage, ise);

        const response = await request(app)
            .get(`${baseUri}/nonExistentConversationId`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            mnemo: "RESOURCE_NOT_FOUND",
            message: "No conversation found for given id: nonExistentConversationId",
        });
    });

    test("GET /conversations/id/messages response return two messages inbox and outbox", async ()=>{
        await createUserInStorage(userStorage, ise);
        const conversationIdHex = Buffer.from(recipientNbr, 'utf8').toString('hex');
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildOutBoxMessage(recipientNbr,"Hello")
        await buildUnreadedInBoxMessage(recipientNbr,"hi")

        const response = await request(app)
            .get(`${baseUri}/${conversationIdHex}/messages`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty("id")
        expect(response.body[1]).toHaveProperty("id")
        expect(stripId(response.body)).toEqual([
            {
                "attachments": [],
                "billed": false,
                "billingType": "",
                "box": "outbox",
                "content": "Hello",
                "ctime": "2024-06-28T10:36:00.000Z",
                "deferred": false,
                "deferredAck": false,
                "errorCode": "",
                "messageType": "sms",
                "messagesNumber": 1,
                "mtime": "2024-06-28T10:36:00.000Z",
                "read": false,
                "recipient": recipientNbr,
                "replyNotification": false,
                "replyType": "inbox",
                "sendingDate": "2024-06-28T10:36:00.000Z",
                "size": 5,
                "status": "sent",
                "subject": ""
            },
            {
                "attachments": [],
                "billed": false,
                "billingType": "",
                "box": "inbox",
                "content": "hi",
                "ctime": "2024-06-28T10:36:00.000Z",
                "deferred": false,
                "deferredAck": false,
                "errorCode": "",
                "messageType": "sms",
                "messagesNumber": 1,
                "mtime": "2024-06-28T10:36:00.000Z",
                "read": false,
                "recipient": recipientNbr,
                "replyNotification": false,
                "replyType": "outbox",
                "sendingDate": "2024-06-28T10:36:00.000Z",
                "size": 2,
                "status": "sent",
                "subject": ""
            }
        ]);
    })

    test("DELETE /conversations/id return http status code 204", async ()=>{
        await createUserInStorage(userStorage, ise);
        const conversationIdHex = Buffer.from(recipientNbr, 'utf8').toString('hex');
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildOutBoxMessage(recipientNbr,"Hello")
        await buildUnreadedInBoxMessage(recipientNbr,"hi")

        const response = await request(app)
            .delete(`${baseUri}/${conversationIdHex}`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(204);
    })

    test("DELETE /conversations/id return http status code 404 when no conversation exists with the given id", async ()=>{
        await createUserInStorage(userStorage, ise);
        const nonexistsconversationIdHex = Buffer.from("notexists", 'utf8').toString('hex');
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildOutBoxMessage(recipientNbr,"Hello")
        await buildUnreadedInBoxMessage(recipientNbr,"hi")

        const response = await request(app)
            .delete(`${baseUri}/${nonexistsconversationIdHex}`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            mnemo: 'RESOURCE_NOT_FOUND',
            message: 'No conversation found for given id: '+nonexistsconversationIdHex
          })
    })

    test("DELETE /conversations/id deleted conversation must not be found in the list of conversations", async ()=>{
        await createUserInStorage(userStorage, ise);
        const messageContent = "test message"
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildOutBoxMessage(recipientNbr,messageContent)
        await buildOutBoxMessage(recipientNbr2,messageContent)
        const conversationId1Hex = Buffer.from(recipientNbr, 'utf8').toString('hex');

        const deleteResponse = await request(app)
            .delete(`${baseUri}/${conversationId1Hex}`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(deleteResponse.status).toBe(204);
        const getResponse = await request(app)
        .get(baseUri)
        .set("authorization", new Token("aServiceId", ise).encryptedValue())
        .set("x-xms-service-id", "aServiceId");
        expect(getResponse.status).toBe(200);
        expect(stripId(getResponse.body)).toEqual([{
            "recipient": recipientNbr2,
            "lastMessageContent": messageContent,
            "unread": 0,
            "messagesNumber": 1,
            "smsNumber": 1,
            "ctime": time,
            "mtime": time,
        }])
    })

    describe.each([
        ["get", (param: string) => request(app!).get(param)],
        ["delete", (param: string) => request(app!).get(param)],
        ["put", (param: string) => request(app!).get(param)],
    ])("Errors cases for method %s", (methodeName, method) => {

        test(`${methodeName} /conversations return error 401 when authorization header is missing`, async () => {
            const response = await method(baseUri);

            expect(response.status).toEqual(401);
            expect(response.body.mnemo).toEqual("MISSING_AUTHORIZATION_BEARER");
            expect(response.body.message).toEqual(
                "Authorization bearer is missing and required for authentication"
            );
        });

        test(`${methodeName} /users/:userId/conversations/:conversationId returns error 401 when authorization header is missing`, async () => {

            const response = await method("/users/me/conversations/50");

            expect(response.status).toEqual(401);
            expect(response.body.mnemo).toEqual("MISSING_AUTHORIZATION_BEARER");
            expect(response.body.message).toEqual("Authorization bearer is missing and required for authentication");
        });

    });

    test("PUT /conversations/id mark unreaded message of a conversation as read", async ()=>{
        await createUserInStorage(userStorage, ise);
        const messageContent = "test message"
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        await buildUnreadedInBoxMessage(recipientNbr,messageContent)
        const conversationIdHex = Buffer.from(recipientNbr, 'utf8').toString('hex');

        const updateResponse = await request(app)
            .put(`${baseUri}/${conversationIdHex}`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");

        expect(updateResponse.status).toBe(204);

        const getResponse = await request(app)
        .get(baseUri)
        .set("authorization", new Token("aServiceId", ise).encryptedValue())
        .set("x-xms-service-id", "aServiceId");

        expect(getResponse.status).toBe(200);
        expect(stripId(getResponse.body)).toEqual([{
            "recipient": recipientNbr,
            "lastMessageContent": messageContent,
            "unread": 1,
            "messagesNumber": 1,
            "smsNumber": 1,
            "ctime": time,
            "mtime": time,
        }])
    })
    test("PUT /conversations/id return 500 status code when pns partner return non success response", async ()=>{
        await createUserInStorage(userStorage, ise);
        const time = '2024-06-28T10:36:00.000Z';
        dateSimulator.dateIs(time);
        const conversationIdHex = Buffer.from(recipientNbr, 'utf8').toString('hex');
        pnsAdapterInMemory.setThrowError(true)
        const updateResponse = await request(app)
            .put(`${baseUri}/${conversationIdHex}`)
            .set("authorization", new Token("aServiceId", ise).encryptedValue())
            .set("x-xms-service-id", "aServiceId");
        expect(updateResponse.status).toBe(500);
        expect(updateResponse.body.mnemo).toEqual("PNS_ERROR");
        expect(updateResponse.body.message).toEqual("Authentication failed with status 401");
    })
})
