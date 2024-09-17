/*
checkPin
PinCodeRequiredError, BadPinCodeError
'PIN_CODE_REQUIRED', 'BAD_PIN_CODE'

PinCodeNotDefinedError util dans le verbe /checkPin, chemin dédié
mnemo === 'PIN_CODE_NOT_DEFINED'

// PinLockedError util dans le verbe /checkPin, chemin dédié
mnemo === 'PIN_LOCKED'


liée à LockedAccountError pas util dans le get /user
suite à erreur mnemo === 'ACCOUNT_LOCKED'
    body.details.lockCode !== 'MANUALLY_LOCKED'


from ExecuteOperationHook
// We must not check the PIN for GET /users/{userId} (OMI must be able to get user status : is PIN defined,
 // check if the requests can be made (maybe the user is locked, or
    // has no PIN code, ...)
    await this.protectRequest(req);

 */

import { EncryptedToken } from "../Token/EncryptedToken";
import { Token } from "../Token/Token";
import { CryptoService } from "../crypto/CryptoService";
import { DateSimulator } from "../date-provider/DateSimulator";
import { QuotaService } from "../quota/QuotaService";
import { DailyQuotaStorageInMemory } from "../quota/storageAdapter/DailyQuotaStorageInMemory";
import { MonthlyQuotaStorageInMemory } from "../quota/storageAdapter/MonthlyQuotaStorageInMemory";
import { BadUserIdError } from "./Errors/BadUserIdError";
import { ForbiddenSauError } from "./Errors/ForbiddenSauError";
import { MessageSignature } from "./MessageSignature";
import { SetUpUserForTest } from "./SetUpUserForTest";
import { UserInfos } from "./UserInfos";
import { UserService } from "./UserService";
import { UserStorageInMemory } from "./storageAdapter/UserStorageInMemory";



describe('UserService', () => {
    const uid = 'aUid'
    const puid = 'aPuid'
    const userId = 'me'
    const encryptedToken = new Token('aServiceId', uid).encryptedValue();

    let userService: UserService;
    let userStorage: UserStorageInMemory
    let monthlyQuotaStorage: MonthlyQuotaStorageInMemory
    let dailyQuotaStorage: DailyQuotaStorageInMemory
    let dateSimulator: DateSimulator;
    let quotaService: QuotaService;

    beforeEach(() => {
        dateSimulator = new DateSimulator();
        userStorage = new UserStorageInMemory();
        monthlyQuotaStorage = new MonthlyQuotaStorageInMemory();
        dailyQuotaStorage = new DailyQuotaStorageInMemory();
        quotaService = new QuotaService(dailyQuotaStorage, monthlyQuotaStorage, userStorage);
        userService = new UserService(userStorage, quotaService);

    })

    afterEach(() => {
        dateSimulator.restore()
    })

    test('userInfo return a user with front information', async () => {
        const userStored = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)
        await quotaService.incrementSentSmsForUser(userStored, 1, '0656874395')

        const userInfo = await userService.userInfos(new EncryptedToken(encryptedToken, 'aServiceId'), userId)

        expect(userInfo).toEqual(new UserInfos(
                60,// unlimited = 64, pro >= 24
                1, // behind is livebox
                1,
                false,
                true,
                false,
                false,
                false,
                ''
            )
        )
    })

    test('userInfo return a user with sau override', async () => {
        const userStored = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60,3)
        await userStorage.overrideWassupSau(userStored.id, 0)

        const userInfo = await userService.userInfos(new EncryptedToken(encryptedToken, 'aServiceId'), userId)

        expect(userInfo).toEqual(new UserInfos(
                60,
                0, // behind is livebox by override utils
                0,
                false,
                true,
                false,
                false,
                false,
                ''
            )
        )
    })

    //
    //if (data.wassupOverride.sau !== undefined) {
    //                 this.wassupOverride.sau

    test('markTermsAsAccepted update thermsAccepted to true for a user', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        await userService.markTermsAccepted(new EncryptedToken(encryptedToken, 'aServiceId'), userId)

        expect(await userService.userInfos(new EncryptedToken(encryptedToken, 'aServiceId'), userId)).toEqual(
            new UserInfos(
                60,// unlimited = 64, pro >= 24
                1, // behind is livebox
                0,
                true,
                true,
                false,
                false,
                false,
                ''
            )
        )
    })

    test('hideTutorial update displayTutorial to false for a user', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        await userService.hideTutorial(new EncryptedToken(encryptedToken, 'aServiceId'), userId)

        expect(await userService.userInfos(new EncryptedToken(encryptedToken, 'aServiceId'), userId)).toEqual(
            new UserInfos(
                60,// unlimited = 64, pro >= 24
                1, // behind is livebox
                0,
                false,
                false,
                false,
                false,
                false,
                ''
            )
        )
    })

    test('updateMessageSignature update message signature for a user', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        await userService.updateMessageSignature(
            new EncryptedToken(encryptedToken, 'aServiceId'),
            userId,
            new MessageSignature(
                true,
                'aSignature'
            ))

        expect(await userService.userInfos(new EncryptedToken(encryptedToken, 'aServiceId'), userId)).toEqual(
            new UserInfos(
                60,// unlimited = 64, pro >= 24
                1, // behind is livebox
                0,
                false,
                true,
                false,
                false,
                true,
                'aSignature'
            )
        )
    })

    test('updatePinCode update pin code with a hashed crypto for a user', async () => {
        const pincode = '1234';
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        await userService.updatePinCode(
            new EncryptedToken(encryptedToken, 'aServiceId'),
            userId,
            pincode)

        expect(CryptoService.checkValueAgainstHash((await userStorage.userByIse(uid)).pinCode, pincode)).toEqual(
            true
        )
    })

    test('update pin code fail with forbidden sau error when user is not behind box', async () => {
        const pincode = '1234';
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60, 2)

        try {
            await userService.updatePinCode(
                new EncryptedToken(encryptedToken, 'aServiceId'),
                userId,
                pincode)
            fail("should fail with forbidden sau")
        } catch (e) {
            expect(e).toEqual(new ForbiddenSauError())
        }
    })

    describe.each([
        ['markTermsAccepted', (encryptedToken: EncryptedToken, userId: string) => userService.markTermsAccepted(encryptedToken, userId)],
        ['hideTutorial', (encryptedToken: EncryptedToken, userId: string) => userService.hideTutorial(encryptedToken, userId)],
        ['updatePinCode', (encryptedToken: EncryptedToken, userId: string) => userService.updatePinCode(encryptedToken, userId, '123')],
        ['updateMessageSignature', (encryptedToken: EncryptedToken, userId: string) => userService.updateMessageSignature(encryptedToken, userId, new MessageSignature(true, 'aSignature'))]
    ])(`update last activity date for the user`, (methodName, method) => {

        test(`on ${methodName}`, async () => {
            await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
            const lastActivityDate = '2024-02-08T13:49:00.000Z';
            dateSimulator.dateIs(lastActivityDate)

            await method(
                new EncryptedToken(encryptedToken, 'aServiceId'),
                userId)

            expect(new Date((await userStorage.userByIse(uid)).lastActivityDate)).toEqual(
                new Date(lastActivityDate)
            )
        })
    })

    describe.each([
        ['userInfos', (encryptedToken: EncryptedToken, userId: string) => userService.userInfos(encryptedToken, userId)],
        ['markTermsAccepted', (encryptedToken: EncryptedToken, userId: string) => userService.markTermsAccepted(encryptedToken, userId)],
        ['hideTutorial', (encryptedToken: EncryptedToken, userId: string) => userService.hideTutorial(encryptedToken, userId)],
        ['updatePinCode', (encryptedToken: EncryptedToken, userId: string) => userService.updatePinCode(encryptedToken, userId, '123')],
        ['updateMessageSignature', (encryptedToken: EncryptedToken, userId: string) => userService.updateMessageSignature(encryptedToken, userId, new MessageSignature(true, 'aSignature'))]
    ])(`on %s`, (methodName, method) => {

        test('throw BadUserIdError when userId is not me', async () => {
            try {
                await method(new EncryptedToken(encryptedToken, 'aServiceId'), 'notMe')
                fail('should fail with BadUserIdError')
            } catch (e) {
                expect(e).toEqual(new BadUserIdError());
            }
        })
    })

})

