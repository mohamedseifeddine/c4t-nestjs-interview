import { DateSimulator } from "../../../date-provider/DateSimulator";
import { MongoClientWithLog } from "../../../storage/MongoClientWithLog";
import { StorageInMemoryBuilder } from "../../../storage/StorageInMemoryBuilder";
import { StorageRealBuilder } from "../../../storage/StorageRealBuilder";
import { BlackListedRecipientStoragePort } from "../../domain/port/BlackListedRecipientStoragePort";
import { BlackListedRecipientStorage } from "./BlackListedRecipientStorage";
import { BlackListedRecipientStorageInMemory } from "./BlackListedRecipientStorageInMemory";



describe.each([
    [new StorageRealBuilder<BlackListedRecipientStorage>((mongoClient) => new BlackListedRecipientStorage(new MongoClientWithLog(mongoClient!)))],
    [new StorageInMemoryBuilder<BlackListedRecipientStorageInMemory>(() => new BlackListedRecipientStorageInMemory())]
])('Black Listed Storage %s', (
    blackListedStorageBuilder
) => {
    let blackListedStorage: BlackListedRecipientStoragePort
    let dateSimulator: DateSimulator;

    const userId = '668e97d7f3a1fb023055c1e2'

    beforeEach(async () => {
        blackListedStorage = await blackListedStorageBuilder.build()
        dateSimulator = new DateSimulator();
    })

    afterEach(async () => {
        await blackListedStorageBuilder.close()
        dateSimulator.restore()
    })

    test('check number is not black listed when no recipient is black listed', async () => {
        const isBlackListed = await blackListedStorage.isBlackListed("+334356789833", userId)

        expect(isBlackListed).toEqual(false)
    })

    test('check number is black listed when recipient is black listed', async () => {

        await blackListedStorage.addBlaklistedRecipientForUser("+3345682097", userId)

        const isBlackListed = await blackListedStorage.isBlackListed("+3345682097", userId)

        expect(isBlackListed).toEqual(true)
    })

    test('check number is not black listed when this recipient is not black listed', async () => {
        await blackListedStorage.addBlaklistedRecipientForUser("+3345682097", userId)

        const isBlackListed = await blackListedStorage.isBlackListed("+33456897", userId)

        expect(isBlackListed).toEqual(false)
    })

    test('check number is not black listed when this recipient is black listed for someone else', async () => {
        await blackListedStorage.addBlaklistedRecipientForUser("+3345682097", userId)

        const isBlackListed = await blackListedStorage.isBlackListed("+3345682097", "778e97d7f3a1fb023055c1f3")

        expect(isBlackListed).toEqual(false)
    })

    test('remove a blacklisted recipient for a specific user', async () => {

        await blackListedStorage.addBlaklistedRecipientForUser("+3345682097", userId)
        await blackListedStorage.removeBlacklistedRecipientForUser("+3345682097", userId)

        const isBlackListed = await blackListedStorage.isBlackListed("+3345682097", userId)

        expect(isBlackListed).toEqual(false)
    })


    test('check ctime and mtime have the same value at creation', async () => {
        const currentDate = '2024-05-02T10:55:00.000Z';
        dateSimulator.dateIs(currentDate)

        await blackListedStorage.addBlaklistedRecipientForUser("+3345682097", userId)

        const blackListedRecipient= await blackListedStorage.getBlackListedRecipientForTest("+3345682097", userId);
        expect(blackListedRecipient.ctime).toEqual(new Date(currentDate));
        expect(blackListedRecipient.mtime).toEqual(new Date(currentDate));
    });

    test('check only mtime is updated at update', async () => {
        const creationDate = '2024-05-02T10:55:00.000Z';
        dateSimulator.dateIs(creationDate)
        await blackListedStorage.addBlaklistedRecipientForUser("+3345682097", userId)
        const modificationDate = '2024-05-02T16:55:00.000Z';
        dateSimulator.dateIs(modificationDate)

        await blackListedStorage.addBlaklistedRecipientForUser("+3345682097", userId)

        const blackListedRecipient= await blackListedStorage.getBlackListedRecipientForTest("+3345682097", userId);
        expect(blackListedRecipient.ctime).toEqual(new Date(creationDate));
        expect(blackListedRecipient.mtime).toEqual(new Date(modificationDate));
    });



})
