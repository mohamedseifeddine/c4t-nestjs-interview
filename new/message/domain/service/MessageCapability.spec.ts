import { QuotaService } from "../../../quota/QuotaService";
import { DailyQuotaStorageInMemory } from "../../../quota/storageAdapter/DailyQuotaStorageInMemory";
import { MonthlyQuotaStorageInMemory } from "../../../quota/storageAdapter/MonthlyQuotaStorageInMemory";
import { SetUpUserForTest } from "../../../User/SetUpUserForTest";
import { UserStorageInMemory } from "../../../User/storageAdapter/UserStorageInMemory";
import { FreeXmsLimitReachableError } from "../../Errors/FreeXmsLimitReachableError";
import { LockedAccountError } from "../../Errors/LockedAccountError";
import { MessageCapability } from "./MessageCapability";



function createRecipientList(size: number) {
    return [...Array.from(Array(size), (e, i) => `${i + 1}`)];
}

describe('MessageCapability', () => {

    const puid = 'aPuid'
    const uid = '18';

    let messageCapability: MessageCapability
    let userStorage: UserStorageInMemory
    let monthlyQuotaStorage: MonthlyQuotaStorageInMemory
    let dailyQuotaStorage: DailyQuotaStorageInMemory
    let quotaService: QuotaService;

    beforeEach(() => {
        userStorage = new UserStorageInMemory()
        monthlyQuotaStorage = new MonthlyQuotaStorageInMemory()
        dailyQuotaStorage = new DailyQuotaStorageInMemory()
        quotaService = new QuotaService(dailyQuotaStorage, monthlyQuotaStorage, userStorage);
        messageCapability = new MessageCapability(userStorage, quotaService)
    })

    test.skip('WIP: depends to master account :Check user account is not whietlisted ', async () => {

    })

    test.skip('WIP: update master account lockCodeList', async () => {

    })

    test('Throw FreeXmsLimitReachableError when user exceeds their monthly quota and he has not the unlimited option', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)

        try {
            await messageCapability.checkCapabality(user, 1, ['+335478966'])
        } catch (error: any) {
            console.log("give me the error", error);

            expect(error).toBeInstanceOf(FreeXmsLimitReachableError)
        }
    })

    test('Throw FreeXmsLimitReachableError when user exceeds their 20 sms to send and he has not the unlimited option', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        const promise = messageCapability.checkCapabality(user, 21, ['+335478966'])

        await expect(promise).rejects.toBeInstanceOf(FreeXmsLimitReachableError)
    })

    test('Throw FreeXmsLimitReachableError when not unlimited user has already send 19 sms, and try to send 2 more', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)
        await quotaService.incrementSentSmsForUser(user, 19, '0656874395');

        const promise = messageCapability.checkCapabality(user, 2, ['+335478966'])

        await expect(promise).rejects.toBeInstanceOf(FreeXmsLimitReachableError)
    })

    test('when user without unlimited option try to send 1 sms and has no previous send sms then has capability to send', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)

        const promise = messageCapability.checkCapabality(user, 1, ['+335478966'])

        await expect(promise).resolves.not.toThrow()
    })

    test('when user without unlimited option try to send 1 sms and has no previous send sms then has capability to send', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)

        const promise = messageCapability.checkCapabality(user, 1, ['+335478966'])

        await expect(promise).resolves.not.toThrow()
    })

    test('when user with unlimited option has always capability to send', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)

        const promise = messageCapability.checkCapabality(user, 1, ['+335478966'])

        await expect(promise).resolves.not.toThrow()
    })

    test('Throw error when user exceeds their monthly quota', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        await quotaService.incrementSentSmsForUser(user, 2000, '0656874395');

        const promise = messageCapability.checkCapabality(user, 1, ['+335478966'])

        await expect(promise).rejects.toEqual(new LockedAccountError(100, 'Fraud suspicion: Monthly sendings. Too many XMS sent this month'))
    })

    test('user has capability to send sms when he doesnt exceeds their monthly quota', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)

        const promise = messageCapability.checkCapabality(user, 1, ['+335478966'])

        await expect(promise).resolves.not.toThrow()
    })

    test('user has capability to send sms when he doesnt exceeds their monthly quota and recepientlist quota', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)

        const promise = messageCapability.checkCapabality(user, 1, ['+335478966'])

        await expect(promise).resolves.not.toThrow()
    })

    test('Throw error when user exceeds their monthly recipients quota', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)

        const promise = messageCapability.checkCapabality(user, 1, createRecipientList(251))

        await expect(promise).rejects.toEqual(new LockedAccountError(100, 'Fraud suspicion: Monthly SMS recipients. Too many SMS recipients this month'))
    })

    test('Throw error when user exceeds their monthly recipients quota with previous quota', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, puid, puid)
        await monthlyQuotaStorage.incrementSentSmsForUser(user.id, 1, createRecipientList(250))

        const promise = messageCapability.checkCapabality(user, 1, createRecipientList(10))

        await expect(promise).rejects.toEqual(new LockedAccountError(100, 'Fraud suspicion: Monthly SMS recipients. Too many SMS recipients this month'))
    })

    test('Throw error when user exceeds their daily quota', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid);
        await quotaService.incrementSentSmsForUser(user, 250, ...['0656874395'])

        const promise = messageCapability.checkCapabality(user, 1, ['+335478966',])

        await expect(promise).rejects.toEqual(new LockedAccountError(100, 'Fraud suspicion: Daily XMS sendings. Too many XMS sent today'))
    })

    test('user has capability to send sms when he doesnt exceeds their daily quota', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)

        const promise = messageCapability.checkCapabality(user, 1, ['+335478966'])

        await expect(promise).resolves.not.toThrow()
    })

    test('Throw LockedAccountError when the recipients are successive', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)

        const promise = messageCapability.checkCapabality(user, 1, ['+335478961', '+335478962', '+335478963', '+335478964', '+335478965', '+335478966'])

        await expect(promise).rejects.toEqual(new LockedAccountError(100, 'Fraud suspicion: Successive recipients. Successive recipients detected. It is seen as fraud'))
    })

    test('user has capability to send sms when the recipients are not successive', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)

        const promise = messageCapability.checkCapabality(user, 1, ['+335478461', '+335458968', '+377478963', '+335478964', '+335478966'])

        await expect(promise).resolves.not.toThrow()
    })
})
