import {UserStorageInMemory} from "../User/storageAdapter/UserStorageInMemory";
import {MonthlyQuotaStorageInMemory} from "./storageAdapter/MonthlyQuotaStorageInMemory";
import {DailyQuotaStorageInMemory} from "./storageAdapter/DailyQuotaStorageInMemory";
import {QuotaService} from "./QuotaService";
import {MonthlyQuotaStored} from "./MonthlyQuotaStored";

async function createPrimaryAccount(userStorage: UserStorageInMemory, puid: string) {
    await userStorage.createUserIfNotExist(puid, 60, 1, '', 'machin@bidule.com')
}

async function createSecondaryAccount(userStorage: UserStorageInMemory, uid: string, puid: string) {
    await userStorage.createUserIfNotExist(uid, 60, 1, puid, 'machin@bidule.com')
}

describe('QuotaService', () => {

    let userStorage: UserStorageInMemory;
    let monthlyQuotaStorage: MonthlyQuotaStorageInMemory;
    let dailyQuotaStorage: DailyQuotaStorageInMemory;
    let quotaService: QuotaService

    const uid = 'aUid'
    const puid = 'aPuid'

    beforeEach(() => {
        userStorage = new UserStorageInMemory();
        monthlyQuotaStorage = new MonthlyQuotaStorageInMemory();
        dailyQuotaStorage = new DailyQuotaStorageInMemory();
        quotaService = new QuotaService(dailyQuotaStorage, monthlyQuotaStorage, userStorage)
    })

    test('when user is secondary, do not increment it', async () => {
        await createSecondaryAccount(userStorage, uid, puid);
        await createPrimaryAccount(userStorage, puid);
        const userStored = await userStorage.userByIse(uid)

        await quotaService.incrementSentSmsForUser(userStored, 1, '0656874395');

        expect(await monthlyQuotaStorage.quotaForUser(userStored.id)).toEqual(new MonthlyQuotaStored(0, 0))
        expect(await dailyQuotaStorage.sentSmsForUser(userStored.id)).toEqual(0)
    })

    test('when user is secondary, increment primary', async () => {
        await createSecondaryAccount(userStorage, uid, puid);
        await createPrimaryAccount(userStorage, puid);
        const userStored = await userStorage.userByIse(uid)

        await quotaService.incrementSentSmsForUser(userStored, 1, '0656874395');

        expect(await monthlyQuotaStorage.quotaForUser(userStored.id)).toEqual(new MonthlyQuotaStored(0, 0))
        expect(await dailyQuotaStorage.sentSmsForUser(userStored.id)).toEqual(0)
    })

    test('when user is primary, increment it', async () => {
        await createPrimaryAccount(userStorage, puid);
        const primaryUserStored = await userStorage.userByIse(puid)

        await quotaService.incrementSentSmsForUser(primaryUserStored, 1, '0656874395');

        expect(await monthlyQuotaStorage.quotaForUser(primaryUserStored.id)).toEqual(new MonthlyQuotaStored(1, 1))
        expect(await dailyQuotaStorage.sentSmsForUser(primaryUserStored.id)).toEqual(1)
    })

    test('when user is secondary read on primary', async () => {
        await createSecondaryAccount(userStorage, uid, puid);
        await createPrimaryAccount(userStorage, puid);
        const userStored = await userStorage.userByIse(uid)
        const primaryUserStored = await userStorage.userByIse(puid)
        await monthlyQuotaStorage.incrementSentSmsForUser(primaryUserStored.id, 1, [''])
        await dailyQuotaStorage.incrementSentSmsForUser(primaryUserStored.id, 1)

        const quota = await quotaService.sentSms(userStored);

        expect(quota.monthly).toEqual(1)
        expect(quota.daily).toEqual(1)
    })

    test('when user is primary read on it', async () => {
        await createPrimaryAccount(userStorage, puid);
        const primaryUserStored = await userStorage.userByIse(puid)
        await monthlyQuotaStorage.incrementSentSmsForUser(primaryUserStored.id, 1, [''])
        await dailyQuotaStorage.incrementSentSmsForUser(primaryUserStored.id, 1)

        const quota = await quotaService.sentSms(primaryUserStored);

        expect(quota.monthly).toEqual(1)
        expect(quota.daily).toEqual(1)
    })

})
