import { DateSimulator } from "../../../date-provider/DateSimulator";
import { MongoClientWithLog } from "../../../storage/MongoClientWithLog";
import { StorageInMemoryBuilder } from "../../../storage/StorageInMemoryBuilder";
import { StorageRealBuilder } from "../../../storage/StorageRealBuilder";
import { SendingMessageBuilder } from "../../domain/model/SendingMessageBuilder";
import { MessagesToSendStoragePort } from "../../domain/port/MessagesToSendStoragePort";
import { MessagesToSendStorage } from "./MessagesToSendStorage";
import { MessagesToSendStorageInMemory } from "./MessagesToSendStorageInMemory";



describe.each([
    [new StorageRealBuilder<MessagesToSendStorage>((mongoClient) => new MessagesToSendStorage(new MongoClientWithLog(mongoClient!)))],
    [new StorageInMemoryBuilder<MessagesToSendStorageInMemory>(() => new MessagesToSendStorageInMemory())]
])('Message storage %s', (
    messageToSendStorageBuilder
) => {
    let messageToSendStorage: MessagesToSendStoragePort;
    let dateSimulator: DateSimulator;
    let messageBuilder: SendingMessageBuilder

    beforeEach(async () => {
        dateSimulator = new DateSimulator();
        messageBuilder = new SendingMessageBuilder()
        messageToSendStorage = await messageToSendStorageBuilder.build();
    });
    afterEach(async () => {
        await messageToSendStorageBuilder.close()
        dateSimulator.restore()
    })

    test('save a message to send', async () => {
        messageBuilder.withDifferedDate('2024-06-10T10:55:01.000Z')
        const message  = messageBuilder.build()
        const messageId = '123456789012123456789012';

        await messageToSendStorage.saveMessageToSend(message, messageId)

        expect(((await messageToSendStorage.message(messageId)).requestedSendingDate)).toEqual(message.deferredDate)
    });

    test('when saving a deferred message tries should be 0', async () => {
        messageBuilder.withDifferedDate('2024-06-10T10:55:01.000Z')
        const message  = messageBuilder.build()
        const messageId = '123456789012123456789012';

        await messageToSendStorage.saveMessageToSend(message, messageId)

        expect(((await messageToSendStorage.message(messageId)).tries)).toEqual(0)
    });

    test('when saving a message with errorCode tries should be 1', async () => {
        messageBuilder.withDifferedDate('2024-06-10T10:55:01.000Z')
        const message  = messageBuilder.build()
        const messageId = '123456789012123456789012';

        await messageToSendStorage.saveMessageToRetry(message, messageId)

        expect(((await messageToSendStorage.message(messageId)).tries)).toEqual(1)
    });

    test('when saving a deferred message, ctime and mtime are the same', async () => {
        const messageId = '123456789012123456789012';
        const message = new SendingMessageBuilder().build()
        const creationDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(creationDate);

        await messageToSendStorage.saveMessageToSend(message, messageId);

        const messageStored = await messageToSendStorage.message(messageId);
        expect(messageStored.ctime).toEqual(new Date(creationDate))
        expect(messageStored.mtime).toEqual(new Date(creationDate))
    });

    test('find all messages staked to send', async () => {
        const messageId = '123456789012123456789012';
        const message = new SendingMessageBuilder().build()
        await messageToSendStorage.saveMessageToSend(message, messageId);

        const stakedMessageToSend = await messageToSendStorage.stakedMessagesToSend()

        expect(stakedMessageToSend[0].message.toString()).toEqual(messageId)
    })

});
