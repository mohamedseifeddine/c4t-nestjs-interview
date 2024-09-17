import {StorageRealBuilder} from "../../storage/StorageRealBuilder";
import {StorageInMemoryBuilder} from "../../storage/StorageInMemoryBuilder";
import {MonthlyQuotaStoragePort} from "../MonthlyQuotaStoragePort";
import {MonthlyQuotaStorage} from "./MonthlyQuotaStorage";
import {MonthlyQuotaStorageInMemory} from "./MonthlyQuotaStorageInMemory";
import { DateSimulator } from "../../date-provider/DateSimulator";
import {MongoClientWithLog} from "../../storage/MongoClientWithLog";
import {MonthlyQuotaStored} from "../MonthlyQuotaStored";

describe.each([
    [new StorageRealBuilder<MonthlyQuotaStorage>((mongoClient) => new MonthlyQuotaStorage(new MongoClientWithLog(mongoClient!)))],
    [new StorageInMemoryBuilder<MonthlyQuotaStorageInMemory>(() => new MonthlyQuotaStorageInMemory())]
])('Monthly Quota Storage %s', (
    monthlyQuotaBuilder
) => {
    const userId = '668e97d7f3a1fb023055c1e2'

    let monthlyQuotaStorage: MonthlyQuotaStoragePort;
    let dateSimulator: DateSimulator;

    beforeEach(async () => {
        monthlyQuotaStorage = await monthlyQuotaBuilder.build();
        dateSimulator = new DateSimulator();
    })
    afterEach(async () => {
        await monthlyQuotaBuilder.close();
    })

    test('at init state, quotaForUser return 0 smsSent', async () => {

        const monthlyQuota = await monthlyQuotaStorage.quotaForUser(userId)

        expect(monthlyQuota.sentSms).toEqual(0);
    })

    test('at init state, quotaForUser return 0 recipient number', async () => {

        const monthlyQuota = await monthlyQuotaStorage.quotaForUser(userId)

        expect(monthlyQuota.recipientNumber).toEqual(0);
    })

    test('increment sent sms for a non existing user create the user and increment sensSms', async () => {

        await monthlyQuotaStorage.incrementSentSmsForUser(userId,1, [''])

        const monthlyQuota = await monthlyQuotaStorage.quotaForUser(userId)
        expect(monthlyQuota.sentSms).toEqual(1);
    })

    test('increment sent sms for a non existing user create the user and increment recipient', async () => {

        await monthlyQuotaStorage.incrementSentSmsForUser(userId,1, ['0654235679'])

        const monthlyQuota = await monthlyQuotaStorage.quotaForUser(userId)
        expect(monthlyQuota.recipientNumber).toEqual(1);
    })

    test('for an existing user, increment recipient when the recipient is not know', async () => {
        await monthlyQuotaStorage.incrementSentSmsForUser(userId,1, ['0654235679'])

        await monthlyQuotaStorage.incrementSentSmsForUser(userId,1, ['0654235680'])

        const monthlyQuota = await monthlyQuotaStorage.quotaForUser(userId)
        expect(monthlyQuota).toEqual(new MonthlyQuotaStored(
            2,
            2
        ));
    })

    test('for an existing user, increment recipient when the recipient is not know', async () => {
        await monthlyQuotaStorage.incrementSentSmsForUser(userId,1, ['0654235679'])

        await monthlyQuotaStorage.incrementSentSmsForUser(userId,2, ['0654235680', '0785948327'])

        const monthlyQuota = await monthlyQuotaStorage.quotaForUser(userId)
        expect(monthlyQuota).toEqual(new MonthlyQuotaStored(
            3,
            3
        ));
    })

    test('for an existing user, do not increment recipient when the recipient is knowed', async () => {
        await monthlyQuotaStorage.incrementSentSmsForUser(userId,1, ['0654235679'])

        await monthlyQuotaStorage.incrementSentSmsForUser(userId,1, ['0654235679'])

        const monthlyQuota = await monthlyQuotaStorage.quotaForUser(userId)
        expect(monthlyQuota).toEqual(new MonthlyQuotaStored(
            2,
            1
        ));
    })

    test('a monthly quota is reset to 0 after one month on read', async () => {
        const m1 = '2024-05-02T10:55:00.000Z';
        dateSimulator.dateIs(m1)
        await monthlyQuotaStorage.incrementSentSmsForUser(userId, 1, [''])
        const m2 = '2024-06-02T10:55:01.000Z';
        dateSimulator.dateIs(m2)

        const monthlyQuota = await monthlyQuotaStorage.quotaForUser(userId)

        expect(monthlyQuota).toEqual(new MonthlyQuotaStored(
            0,
            0
        ))
    })

    test('a monthly quota doesnt reset in the same month on read', async () => {
        const m1 = '2024-05-02T10:55:00.000Z';
        dateSimulator.dateIs(m1)
        await monthlyQuotaStorage.incrementSentSmsForUser(userId, 1, ['0654235679'])
        const m2 = '2024-05-02T10:55:01.000Z';
        dateSimulator.dateIs(m2)

        const monthlyQuota = await monthlyQuotaStorage.quotaForUser(userId)

        expect(monthlyQuota).toEqual(new MonthlyQuotaStored(
            1,
            1
        ))
    })

    test('a monthly quota is reset to 0 after one month on increment', async () => {
        const m1 = '2024-05-02T10:55:00.000Z';
        dateSimulator.dateIs(m1)
        await monthlyQuotaStorage.incrementSentSmsForUser(userId, 1, ['0654235679'])
        const m2 = '2024-06-02T10:55:01.000Z';
        dateSimulator.dateIs(m2)

        await monthlyQuotaStorage.incrementSentSmsForUser(userId, 1, ['0654235680'])

        const monthlyQuota = await monthlyQuotaStorage.quotaForUser(userId)
        expect(monthlyQuota).toEqual(new MonthlyQuotaStored(
            1,
            1
        ))
    })
})
