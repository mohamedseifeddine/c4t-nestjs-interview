import {MessageStorageInMemory} from "../../adapters/storageAdapter/MessageStorageInMemory";
import {SendingMessageBuilder} from "../model/SendingMessageBuilder";
import {LogsStreamInMemory} from "../../../logger/LogsStreamInMemory";
import {LoggerAdapter} from "../../../logger/LoggerAdapter";
import {XmsBrockerAcknowledgementService} from "./XmsBrockerAcknowledgementService";


describe('XmsBrockerAcknowledgementService', () => {

    const hubMessageId = '123';

    let logStream: LogsStreamInMemory;
    let messageStorage: MessageStorageInMemory;
    let xmsBrockerAcknowledgementService: XmsBrockerAcknowledgementService;

    beforeEach(() => {
        logStream = new LogsStreamInMemory();
        LoggerAdapter.logStream = logStream;
        messageStorage = new MessageStorageInMemory();
        xmsBrockerAcknowledgementService = new XmsBrockerAcknowledgementService(messageStorage);
    })


    test('on acknowledgement, message is mark as received', async () => {
        await messageStorage.storeMessage(
            new SendingMessageBuilder().whithHubMessageId(hubMessageId).build(),
            'aUserId'
        );

        await xmsBrockerAcknowledgementService.acknowledge(hubMessageId, 0)

        expect((await messageStorage.messageByHubMessageId(hubMessageId)).status).toEqual('received')
    })

    test('on acknowledgement, message has no errorCode', async () => {
        await messageStorage.storeMessage(
            new SendingMessageBuilder().whithHubMessageId(hubMessageId).build(),
            'aUserId'
        );

        await xmsBrockerAcknowledgementService.acknowledge(hubMessageId, 0)

        expect((await messageStorage.messageByHubMessageId(hubMessageId)).errorCode).toEqual('null')
    })


    test('on acknowledgement, log a warn when message doesn\'t exist', async () => {

        await xmsBrockerAcknowledgementService.acknowledge(hubMessageId, 0)

        expect(logStream.logs[0].msg).toEqual(`Unable to find a XMS matching the given XMS broker message ID : ${hubMessageId}`)
    })

    test('on acknowledgement, do not throw when message doesn\'t exist', async () => {

        const ackPromise = xmsBrockerAcknowledgementService.acknowledge(hubMessageId, 0)

        await expect(ackPromise).resolves.not.toThrow()
    })

    test('when acknowledgement status is not received neither error, then do nothing', async () => {
        await messageStorage.storeMessage(
            new SendingMessageBuilder()
                .whithHubMessageId(hubMessageId)
                .withStatus('sent')
                .build(),
            'aUserId'
        );

        const ackPromise = xmsBrockerAcknowledgementService.acknowledge(hubMessageId, 4)

        await expect(ackPromise).resolves.not.toThrow()
        expect((await messageStorage.messageByHubMessageId(hubMessageId)).status).toEqual('sent')
    })

    test('when acknowledgement status is error, the message is updated with an error code', async () => {
        await messageStorage.storeMessage(
            new SendingMessageBuilder().whithHubMessageId(hubMessageId).build(),
            'aUserId'
        );

        await xmsBrockerAcknowledgementService.acknowledge(hubMessageId, -99)

        expect((await messageStorage.messageByHubMessageId(hubMessageId)).errorCode).toEqual('xms_broker_-99')
    })

    test('on acknowledgement, do not send mail when message doesn\'t exist', async () => {

    })

    test('on acknowledgement, send mail when acknoledgment status is error', async () => {

    })

    test('on acknowledgement, stack mail when sending mail when acknoledgment status is error is fail', async () => {

    })

    test('on acknowledgement, do not send notif when message doesn\'t exist', async () => {

    })

    test('on acknowledgement, send notif when message status is error', async () => {

    })

    test('on acknowledgement, send notif when message status is received', async () => {

    })
})
