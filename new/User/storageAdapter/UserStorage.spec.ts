import {objectStoredJestMatcher} from "../../ObjectStoredJestMatcher";
import {DateSimulator} from "../../date-provider/DateSimulator";
import {StorageInMemoryBuilder} from "../../storage/StorageInMemoryBuilder";
import {StorageRealBuilder} from "../../storage/StorageRealBuilder";
import {UserNotFoundInStorageWithIseError} from "../Errors/UserNotFoundInStorageWithIseError";
import {MessageSignature} from "../MessageSignature";
import {UserStoragePort} from "../UserStoragePort";
import {User} from "../User";
import UserStorage from "./UserStorage";
import {UserStorageInMemory} from "./UserStorageInMemory";
import {MongoClientWithLog} from "../../storage/MongoClientWithLog";
import {UserNotFoundInStorageWithUserIdError} from "../Errors/UserNotFoundInStorageWithUserIdError";


objectStoredJestMatcher()

describe.each([
    [new StorageRealBuilder<UserStorage>((mongoClient) => new UserStorage(new MongoClientWithLog(mongoClient!)))],
    [new StorageInMemoryBuilder<UserStorageInMemory>(() => new UserStorageInMemory())]
])('User storage %s', (
    userStorageBuilder
) => {
    const puid = "aPuid"
    const ulo = 'machin@bidule.com'

    let userStorage: UserStoragePort
    let dateSimulator: DateSimulator;

    beforeEach(async () => {
        userStorage = await userStorageBuilder.build()
        dateSimulator = new DateSimulator();
    })
    afterEach(async () => {
        await userStorageBuilder.close()
        dateSimulator.restore()
    })

    test('find a user by is ise (uid) with user infos', async () => {
        const spr = 64;
        const sau = 1;
        const ise = "u1";
        const currentDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(currentDate)

        await userStorage.createUserIfNotExist(ise, spr, sau, puid, ulo)

        const expectUserStored = new User(ise, spr, sau, ulo, puid, -1, '', false, 0, false, '', false, true, new Date(currentDate), new Date(currentDate), new Date(currentDate), '')
        expect(await userStorage.userByIse(ise)).toEqualIgnoringId(expectUserStored)
    })

    test('find a user by userId', async () => {
        const spr = 64;
        const sau = 1;
        const ise = "u1";
        await userStorage.createUserIfNotExist(ise, spr, sau, puid, ulo)
        const user = await userStorage.userByIse(ise);

        const userFindById = await userStorage.userById(user.id)

        expect(userFindById).toEqualIgnoringId(user)
    })

    test('update wassup data only on existing user', async () => {
        const newSpr = 64;
        const newSau = 1;
        const ise = "u1";
        const creationDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(creationDate)
        await userStorage.createUserIfNotExist(ise, 60, 0, puid, ulo)

        await userStorage.createUserIfNotExist(ise, newSpr, newSau, puid, ulo)

        const expectUserStored = new User(ise, newSpr, newSau, ulo, puid, -1,'', false, 0, false, '', false, true, new Date(creationDate), new Date(creationDate), new Date(creationDate), '')
        expect(await userStorage.userByIse(ise)).toEqualIgnoringId(expectUserStored)
    })

    test('do not update creation date on update existing user', async () => {
        const spr = 64;
        const sau = 1;
        const ise = "u1";
        const creationDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(creationDate)
        await userStorage.createUserIfNotExist(ise, 60, 0, puid, ulo)
        const currentDate = '2024-03-08T13:49:00.000Z';
        dateSimulator.dateIs(currentDate)

        await userStorage.createUserIfNotExist(ise, spr, sau, puid, ulo)

        expect((await userStorage.userByIse(ise)).firstConnectionDate).toEqual(new Date(creationDate))
    })

    test('update last connection date for a user', async () => {
        const firstConnectionDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(firstConnectionDate)
        const ise = "u1";
        await userStorage.createUserIfNotExist(ise, 60, 1, puid, ulo)

        const lastConectionDate = '2024-02-08T14:49:00.000Z';
        dateSimulator.dateIs(lastConectionDate)
        await userStorage.updateLastConnectionDateToNow(ise);

        expect((await userStorage.userByIse(ise)).firstConnectionDate).toEqual(new Date(firstConnectionDate))
        expect((await userStorage.userByIse(ise)).lastConnectionDate).toEqual(new Date(lastConectionDate))
    })

    test('update last last Activity date for a user', async () => {
        const ise = "u1";
        await userStorage.createUserIfNotExist(ise, 60, 1, puid, ulo)

        const lastActivityDate = '2024-02-08T14:49:00.000Z';
        dateSimulator.dateIs(lastActivityDate)
        await userStorage.updateLastActivityDateToNow(ise);

        expect((await userStorage.userByIse(ise)).lastActivityDate).toEqual(new Date(lastActivityDate))
    })

    test('update terms accepted to true for a user', async () => {
        const ise = "u1";
        await userStorage.createUserIfNotExist(ise, 60, 1, puid, ulo)

        await userStorage.updateTermsAcceptedToTrue(ise);

        expect((await userStorage.userByIse(ise)).termsAccepted).toEqual(true)
    })

    test('update display Tutorial to false for a user', async () => {
        const ise = "u1";
        await userStorage.createUserIfNotExist(ise, 60, 1, puid, ulo)

        await userStorage.updateDisplayTutorialToFalse(ise);

        expect((await userStorage.userByIse(ise)).displayTutorial).toEqual(false)
    })

    test('update message signature to true and with a message for a user', async () => {
        const ise = "u1";
        await userStorage.createUserIfNotExist(ise, 60, 1, puid, ulo)

        await userStorage.updateMessageSignature(ise, new MessageSignature(true, 'aSignature'));

        expect((await userStorage.userByIse(ise)).addSignatureToMessage).toEqual(true)
        expect((await userStorage.userByIse(ise)).messageSignature).toEqual('aSignature')
    })

    test('update pin code for a user set pintries to 0 and pinlocked to false', async () => {
        const ise = "u1";
        await userStorage.createUserIfNotExist(ise, 60, 1, puid, ulo)
        await userStorage.blockPinForTest(ise);

        await userStorage.updatePinCode(ise, '123');

        expect((await userStorage.userByIse(ise)).pinCode).toEqual('123')
        expect((await userStorage.userByIse(ise)).pinTries).toEqual(0)
        expect((await userStorage.userByIse(ise)).pinLocked).toEqual(false)
    })

    test('override wassup sau for a user', async () => {
        const ise = "u1";
        await userStorage.createUserIfNotExist(ise, 60, 3, puid, ulo)
        const user = await userStorage.userByIse(ise)

        await userStorage.overrideWassupSau(user.id, 1);

        expect((await userStorage.userByIse(ise)).wassupOverrideSau).toEqual(1)
        expect((await userStorage.userByIse(ise)).sau).toEqual(3)
    })

    test('the user is not find when it is marked as deleted', async () => {
        const ise = "u1";
        await userStorage.createUserIfNotExist(ise, 64, 24, puid, ulo)
        await userStorage.flagAsDeleted(ise)
        try {
            await userStorage.userByIse(ise)
            fail()
        } catch (e) {
            expect(e).toEqual(new UserNotFoundInStorageWithIseError(ise))
        }
    })


    describe.each([
        ['userByIse', (ise: string) => userStorage.userByIse(ise)],
        ['updateLastConnectionDatesToNow', (ise: string) => userStorage.updateLastConnectionDateToNow(ise)],
        ['updateLastActivityDateToNow', (ise: string) => userStorage.updateLastActivityDateToNow(ise)],
        ['updateTermsAcceptedToTrue', (ise: string) => userStorage.updateTermsAcceptedToTrue(ise)],
        ['updateDisplayTutorialToFalse', (ise: string) => userStorage.updateDisplayTutorialToFalse(ise)],
        ['updatePinCode', (ise: string) => userStorage.updatePinCode(ise, '123')],
        ['updateMessageSignature', (ise: string) => userStorage.updateMessageSignature(ise, new MessageSignature(true, 'aSignature'))]
    ])(`throw user not found in storage with ise error when the user does not exist`, (methodName, method) => {

        test(`on ${methodName}`, async () => {
            const ise = "u1";
            try {
                await method(ise)
                fail('expected faillure')
            } catch (e) {
                expect(e).toEqual(new UserNotFoundInStorageWithIseError(ise))
            }
        })
    })

    test('throw user not found in storage with userId error when the user does not exist', async () => {
        const userId = '123456789012345ACB345234';

        const userFindByIdPromise = userStorage.userById(userId)

        await expect(userFindByIdPromise).rejects.toThrow(new UserNotFoundInStorageWithUserIdError(userId))
    })
})



