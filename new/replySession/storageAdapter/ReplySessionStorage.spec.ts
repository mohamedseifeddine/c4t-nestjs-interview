import {DateSimulator} from "../../date-provider/DateSimulator";
import {MessageStoredBuilder} from "../../message/domain/model/MessageStoredBuilder";
import {MongoClientWithLog} from "../../storage/MongoClientWithLog";
import {StorageRealBuilder} from "../../storage/StorageRealBuilder";
import {ReplySessionsNotFoundInStorageError} from "../Errors/ReplySessionsNotFoundInStorageError";
import {ReplySessionsStoragePort} from "../ReplySessionsStoragePort";
import {ReplySessionsStorage} from "./ReplySessionStorage";
import {ReplySessionConflictError} from "../Errors/ReplySessionConflictError";
import {StorageInMemoryBuilder} from "../../storage/StorageInMemoryBuilder";
import {ReplySessionStorageInMemory} from "./ReplySessionStorageInMemory";


describe.each([
    [new StorageRealBuilder<ReplySessionsStorage>((mongoClient) => new ReplySessionsStorage(new MongoClientWithLog(mongoClient!)))],
    [new StorageInMemoryBuilder<ReplySessionStorageInMemory>(() => new ReplySessionStorageInMemory())],

])('Reply sessions Storage %s', (
    replySessionsStorageBuilder
) => {
    let replySessionsStorage: ReplySessionsStoragePort
    let dateSimulator: DateSimulator;
    let messageStoredBuilder: MessageStoredBuilder;
    const recipient = "+332155568"
    const virtualShortCodeId = "webxmsCR";

    beforeEach(async () => {
        replySessionsStorage = await replySessionsStorageBuilder.build()
        dateSimulator = new DateSimulator();
        messageStoredBuilder = new MessageStoredBuilder()

    })

    afterEach(async () => {
        await replySessionsStorageBuilder.close()
        dateSimulator.restore()
    })

    test("replySession throw an ReplySessionsNotFoundInStorageError when the reply session doesn't exist", async () => {

        await expect(replySessionsStorage.replySessions("aWebxmsShortCode", recipient)).rejects.toThrow(
            new ReplySessionsNotFoundInStorageError("aWebxmsShortCode", recipient)
        )
    })

    test("create replySession", async () => {
        const MessageStored = new MessageStoredBuilder().withDestinationPhoneNumber(recipient).withId('123456789012345AEF4523FD').build()

        await replySessionsStorage.createReplySessions("aWebxmsShortCode", MessageStored);

        expect((await replySessionsStorage.replySessions("aWebxmsShortCode", recipient)).recipient).toEqual(recipient)
    })

    test('check ctime and mtime have the same value at creation', async () => {
        const currentDate = '2024-05-02T10:55:00.000Z';
        dateSimulator.dateIs(currentDate)
        const message = messageStoredBuilder.withDestinationPhoneNumber(recipient).withId('123456789012345AEF4523FD').build()

        await replySessionsStorage.createReplySessions(virtualShortCodeId, message)

        const replySessions = await replySessionsStorage.replySessions(virtualShortCodeId, recipient);
        expect(replySessions.ctime).toEqual(new Date(currentDate));
        expect(replySessions.mtime).toEqual(new Date(currentDate));
    });

    test('a create reply session throw a conflict error when the session already exist', async () => {
        const message = messageStoredBuilder.withDestinationPhoneNumber(recipient).withId('123456789012345AEF4523FD').build();
        await replySessionsStorage.createReplySessions(virtualShortCodeId, message);

        const createPromise = replySessionsStorage.createReplySessions(virtualShortCodeId, message);

        await expect(createPromise).rejects.toThrow(new ReplySessionConflictError(virtualShortCodeId, message.recipient));
    });

    test('a create reply session do not throw conflict error after 7 days of an already existing one', async () => {
        dateSimulator.dateIs('2024-05-02T10:55:00.000Z');
        const message = messageStoredBuilder.withDestinationPhoneNumber(recipient).withId('123456789012345AEF4523FD').build();
        await replySessionsStorage.createReplySessions(virtualShortCodeId, message);

        const secondCreationDate = '2024-05-09T10:56:00.000Z';
        dateSimulator.dateIs(secondCreationDate);
        await replySessionsStorage.createReplySessions(virtualShortCodeId, message);

        const replySessions = await replySessionsStorage.replySessions(virtualShortCodeId, recipient);
        expect(replySessions.ctime).toEqual(new Date(secondCreationDate));
    });

    test('throw ReplySessionsNotFoundInStorageError after 7 days of an already existing session', async () => {
        dateSimulator.dateIs('2024-05-02T10:55:00.000Z');
        const message = messageStoredBuilder.withDestinationPhoneNumber(recipient).withId('123456789012345AEF4523FD').build();
        await replySessionsStorage.createReplySessions(virtualShortCodeId, message);

        const secondCreationDate = '2024-05-09T10:56:00.000Z';
        dateSimulator.dateIs(secondCreationDate);
        const replySessions = replySessionsStorage.replySessions(virtualShortCodeId, recipient);

        await expect(replySessions).rejects.toThrow(new ReplySessionsNotFoundInStorageError(virtualShortCodeId, recipient));
    });

})
