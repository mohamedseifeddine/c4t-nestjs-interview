import express, {Express} from "express";
import {SessionInfoStartMiddleware} from "../../globalMiddlewares/SessionInfoStartMiddleware";
import {FormatRequestMiddleware} from "../../globalMiddlewares/FormatRequestMiddleware";
import {SessionInfoMiddleware} from "../../globalMiddlewares/SessionInfoMiddleware";
import request from "supertest";
import {SendingMessageBuilder} from "../domain/model/SendingMessageBuilder";
import {MessageStorageInMemory} from "../adapters/storageAdapter/MessageStorageInMemory";
import {XmsBrockerAcknowledgementService} from "../domain/service/XmsBrockerAcknowledgementService";
import {XmsBrockerRouter} from "./XmsBrockerRouter";
import {XmsBrockerReplyService} from "../domain/service/XmsBrockerReplyService";
import {ReplySessionStorageInMemory} from "../../replySession/storageAdapter/ReplySessionStorageInMemory";
import {PaddockAdapterInMemory} from "../adapters/PaddockAdapter/PaddockAdapterInMemory";
import {BlackListedRecipientStorageInMemory} from "../adapters/storageAdapter/BlackListedRecipientStorageInMemory";
import {UserStorageInMemory} from "../../User/storageAdapter/UserStorageInMemory";
import {ShortCodeConfig} from "../adapters/ShortCodeConfigBuilder";
import {ShortCodeNoReply} from "../domain/model/ShortCodeNoReply";
import {ShortCodeInternational} from "../domain/model/ShortCodeInternational";
import {ShortCodeReplyable} from "../domain/model/ShortCodeReplyable";
import {MessageStoredBuilder} from "../domain/model/MessageStoredBuilder";


describe('XmsBrockerRouter', () => {
    const shortCodeConfig = new ShortCodeConfig(
        new ShortCodeNoReply("aNoReplySenderadress", ["10000"], "noReplyOdiAuthorization"),
        new ShortCodeInternational("aInterSenderadress", ["20000"], "interOdiAuthorization"),
        [
            new ShortCodeReplyable("aReplyableSenderadress0", ["30000", "3200"], "ReplyableOdiAuthorization0000000000000000000000000"),
            new ShortCodeReplyable("aReplyableSenderadress1", ["30001", "3201"], "ReplyableOdiAuthorization1"),
        ]
    )

    let app: Express;
    let messageStorage: MessageStorageInMemory;
    let replySessionStorage: ReplySessionStorageInMemory;

    beforeEach(() => {
        messageStorage = new MessageStorageInMemory();

        replySessionStorage = new ReplySessionStorageInMemory();
        const paddockAdapter = new PaddockAdapterInMemory()
        const blackListedRecipientStorage = new BlackListedRecipientStorageInMemory();
        const userStorage = new UserStorageInMemory();
        const xmsBrockerReplyService = new XmsBrockerReplyService(shortCodeConfig, paddockAdapter, replySessionStorage, blackListedRecipientStorage, userStorage, messageStorage)

        const xmsBrockerRouter =
            new XmsBrockerRouter(
                new XmsBrockerAcknowledgementService(messageStorage),
                xmsBrockerReplyService
            )

        app = express();
        app.use(new SessionInfoStartMiddleware().middleware);
        app.use(new FormatRequestMiddleware().middleware);
        app.use(new SessionInfoMiddleware().middleware);
        app.use(xmsBrockerRouter.router);
    })


    test('POST messages ack answer 200 ok with body at Status=0', async () => {

        const response = await request(app)
            .post('/messages/ack')
            .send({
                MsgId: '1234',
                Status: 0
            })

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
        expect(response.text).toBe('Status=0')
    })

    test('POST messages ack message is mark as received', async () => {
        const hubMessageId = '1234'
        await messageStorage.storeMessage(
            new SendingMessageBuilder().whithHubMessageId(hubMessageId).build(),
            'aUserId'
        );

        await request(app)
            .post('/messages/ack')
            .send({
                MsgId: '1234',
                Status: 0
            })

        expect((await messageStorage.messageByHubMessageId(hubMessageId)).status).toEqual('received')
    })

    test('POST messages ack return bad request with missing parameter MsgId', async () => {

        const res = await request(app)
            .post('/messages/ack')

        expect(res.status).toEqual(400)
        expect(res.text).toEqual('missing parameter : MsgId')
    })

    test('POST messages ack return bad request with missing parameter Status', async () => {

        const res = await request(app)
            .post('/messages/ack')
            .send({
                MsgId: '1234'
            })

        expect(res.status).toEqual(400)
        expect(res.text).toEqual('missing parameter : Status')
    })

    test('Post messages reply return 200 ok with body at Status=0', async () => {

        const response = await request(app)
            .post('/messages/reply')
            .send({
                DA: 1234,
                SOA: '3367890',
                TimeCreated: 12345667,
                MsgType: 0
            })

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
        expect(response.text).toBe('Status=0')
    })

    test('POST messages reply return bad request with missing parameter DA', async () => {
        // DA = shortCode

        const res = await request(app)
            .post('/messages/reply')

        expect(res.status).toEqual(400)
        expect(res.text).toEqual('missing parameter : DA')
    })

    test('POST messages reply return bad request with missing parameter SOA', async () => {
        //SOA = sender = origine message recipient

        const res = await request(app)
            .post('/messages/reply')
            .send({
                DA: 1234
            })

        expect(res.status).toEqual(400)
        expect(res.text).toEqual('missing parameter : SOA')
    })

    test('POST messages reply return bad request with missing parameter TimeCreated', async () => {

        const res = await request(app)
            .post('/messages/reply')
            .send({
                DA: 1234,
                SOA: '3367890'
            })

        expect(res.status).toEqual(400)
        expect(res.text).toEqual('missing parameter : TimeCreated')
    })
//TODO WIP
    test.skip(`return 200 ok with body at Status=0 when MsgType is 6`, async () => {

        const response = await request(app)
            .post('/messages/reply')
            .send({
                DA: 1234,
                SOA: '3367890',
                TimeCreated: 12345667,
                MsgType: 6
            })

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
        expect(response.text).toBe('Status=0')
    })

    test(`return 200 ok with body at Status=0 when MsgType is missing (sms by default)`, async () => {

        const response = await request(app)
            .post('/messages/reply')
            .send({
                DA: 1234,
                SOA: '3367890',
                TimeCreated: 12345667
            })

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
        expect(response.text).toBe('Status=0')
    })

    test(`POST messages reply return bad request with specific MsgType setting when it's not set to 0 or 6`, async () => {

        const res = await request(app)
            .post('/messages/reply')
            .send({
                DA: 1234,
                SOA: '3367890',
                TimeCreated: 12345667,
                MsgType: 5
            })

        expect(res.status).toEqual(400)
        expect(res.text).toEqual('parameter MsgType should be set to 0 or 6')
    })

    test('Post messages reply store a multipacket when TextUdhValue is set', async () => {
        const userId = 'aUserId';
        const message = new MessageStoredBuilder().withDestinationPhoneNumber('3367890').withUserId(userId).build()
        await replySessionStorage.createReplySessions(shortCodeConfig.shortCodesReplyables[0].senderAddress, message)

        const response = await request(app)
            .post('/messages/reply')
            .send({
                DA: shortCodeConfig.shortCodesReplyables[0].virtualShortCode[0],
                SOA: '3367890',
                TimeCreated: 12345667,
                MsgType: 0,
                Headers: 'PIDValue: 127\n' +
                    'DCSValue: 245\n' +
                    'TextUDHValue: 050003AB0201'
            })

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
        expect(response.text).toBe('Status=0')
        const messages = await messageStorage.messages(userId);
        expect(messages[0].packets[0].msgId).toEqual('83887019')
    })

    test('Post messages reply return an error when textUdhValue is bad formated', async () => {
        const userId = 'aUserId';
        const message = new MessageStoredBuilder().withDestinationPhoneNumber('3367890').withUserId(userId).build()
        await replySessionStorage.createReplySessions(shortCodeConfig.shortCodesReplyables[0].senderAddress, message)

        const res = await request(app)
            .post('/messages/reply')
            .send({
                DA: shortCodeConfig.shortCodesReplyables[0].virtualShortCode[0],
                SOA: '3367890',
                TimeCreated: 12345667,
                MsgType: 0,
                Headers: 'PIDValue: 127\n' +
                    'DCSValue: 245\n' +
                    'TextUDHValue: 040003AB0201'
            })

        expect(res.status).toEqual(400)
        expect(res.text).toEqual('parameter TextUDHValue should be start by to 05 or 06')
    })
});
