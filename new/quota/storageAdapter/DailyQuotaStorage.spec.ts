import {StorageRealBuilder} from "../../storage/StorageRealBuilder";
import {StorageInMemoryBuilder} from "../../storage/StorageInMemoryBuilder";
import {DailyQuotaStoragePort} from "../DailyQuotaStoragePort";
import {DailyQuotaStorage} from "./DailyQuotaStorage";
import {DailyQuotaStorageInMemory} from "./DailyQuotaStorageInMemory";
import {DateSimulator} from "../../date-provider/DateSimulator";
import {MongoClientWithLog} from "../../storage/MongoClientWithLog";

describe.each([
    [new StorageRealBuilder<DailyQuotaStorage>((mongoClient) => new DailyQuotaStorage(new MongoClientWithLog(mongoClient!)))],
    [new StorageInMemoryBuilder<DailyQuotaStorageInMemory>(() => new DailyQuotaStorageInMemory())]
])('Daily Quota Storage %s', (
    dailyQuotaBuilder
) => {
    const userId = '668e97d7f3a1fb023055c1e2'

    let dailyQuotaStorage: DailyQuotaStoragePort;
    let dateSimulator: DateSimulator;

    beforeEach(async () => {
        dailyQuotaStorage = await dailyQuotaBuilder.build();
        dateSimulator = new DateSimulator();
    })
    afterEach(async () => {
        await dailyQuotaBuilder.close();
        dateSimulator.restore()
    })

    test('sentSmsForUser return 0 smsSent', async () => {

        const sentSms = await dailyQuotaStorage.sentSmsForUser(userId)

        expect(sentSms).toEqual(0);
    })

    test('increment sent sms for a non existing user create the user and increment sensSms', async () => {

        await dailyQuotaStorage.incrementSentSmsForUser(userId,1)

        const sentSms = await dailyQuotaStorage.sentSmsForUser(userId)
        expect(sentSms).toEqual(1);
    })

    test('a daily quota is not reset to 0 before one day on read', async () => {
        const j1 = '2024-05-02T10:55:00.000Z';
        dateSimulator.dateIs(j1)
        await dailyQuotaStorage.incrementSentSmsForUser(userId, 1)
        const j2 = '2024-05-03T10:54:00.000Z';
        dateSimulator.dateIs(j2)

        const sentSms = await dailyQuotaStorage.sentSmsForUser(userId)

        expect(sentSms).toEqual(1);
    })

    test('a daily quota is reset to 0 after one day on read', async () => {
        const j1 = '2024-05-02T10:55:00.000Z';
        dateSimulator.dateIs(j1)
        await dailyQuotaStorage.incrementSentSmsForUser(userId, 1)
        const j2 = '2024-05-03T10:55:01.000Z';
        dateSimulator.dateIs(j2)

        const sentSms = await dailyQuotaStorage.sentSmsForUser(userId)

        expect(sentSms).toEqual(0);
    })

    test('a daily quota is reset to 0 after one day on increment', async () => {
        const j1 = '2024-05-02T10:55:00.000Z';
        dateSimulator.dateIs(j1)
        await dailyQuotaStorage.incrementSentSmsForUser(userId, 1)
        const j2 = '2024-05-03T10:55:01.000Z';
        dateSimulator.dateIs(j2)

        await dailyQuotaStorage.incrementSentSmsForUser(userId, 1)

        const sentSms = await dailyQuotaStorage.sentSmsForUser(userId)
        expect(sentSms).toEqual(1);
    })
})
