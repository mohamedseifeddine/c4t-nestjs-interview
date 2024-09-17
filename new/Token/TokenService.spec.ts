import {UserNotFoundInStorageWithIseError} from "../User/Errors/UserNotFoundInStorageWithIseError";
import {UserStorageInMemory} from "../User/storageAdapter/UserStorageInMemory";
import {DateSimulator} from "../date-provider/DateSimulator";
import {WassupUser} from "../wassup/WassupUser";
import {WassupAdapterInMemory, WassupUserInMemory} from "../wassup/wassupAdapterInMemory";
import {ForbiddenUserContractError} from "./Errors/ForbiddenUserContractError";
import {ForbiddenUserTypeError} from "./Errors/ForbiddenUserTypeError";
import {Token} from "./Token";
import TokenService from "./TokenService";
import {SessionInfo} from "../globalMiddlewares/SessionInfo";
import * as cls from "cls-hooked";


describe('TokenService', () => {

    let wassupAdapter: WassupAdapterInMemory;
    let userStorage: UserStorageInMemory;
    let tokenService: TokenService;
    let dateSimulator: DateSimulator;

    const ise = 'aUid';
    const puid = 'aPuid'
    const aWassupUser = new WassupUser(ise, 1, puid, 60, 1, 'machinSecondaire@bidule.com');
    const aWassupUserPrimary = new WassupUser(puid, 1, '', 60, 1, 'machin@bidule.com');


    beforeEach(() => {
        wassupAdapter = new WassupAdapterInMemory();
        userStorage = new UserStorageInMemory();
        tokenService = new TokenService(wassupAdapter, userStorage);
        dateSimulator = new DateSimulator();
    })

    afterEach(() => {
        dateSimulator.restore()
    })

    test('get a token for a cookie', async () => {
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('aCookie', aWassupUser))
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('anotherCookie', aWassupUserPrimary))
        cls.createNamespace('session').run(async () => {
            SessionInfo.storeServiceId('aServiceId')

            const token = await tokenService.getToken('aCookie');

            expect(token).toEqual(new Token('aServiceId', aWassupUser.uid))
        })
    })

    test('first connection create a user in repository', async () => {
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('aCookie', aWassupUser))
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('anotherCookie', aWassupUserPrimary))

        await tokenService.getToken('aCookie');

        expect((await userStorage.userByIse(ise))).toBeDefined();
    })

    test('first connection create a user with first connection date and last connection date equal', async () => {
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('aCookie', aWassupUser))
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('anotherCookie', aWassupUserPrimary))

        await tokenService.getToken('aCookie');

        const userStored = await userStorage.userByIse(ise);
        expect(userStored.firstConnectionDate).toBeDefined();
        expect(userStored.firstConnectionDate).toEqual(userStored.lastConnectionDate);
    })

    test('when connection of an existing user,the last connection date is updated', async () => {
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('aCookie', aWassupUser))
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('anotherCookie', aWassupUserPrimary))
        dateSimulator.dateIs('2024-02-08T13:49:00.000Z')
        await userStorage.createUserIfNotExist(aWassupUser.uid, aWassupUser.spr, aWassupUser.sau, puid, aWassupUser.ulo);

        dateSimulator.dateIs('2024-02-09T14:59:00.000Z')
        await tokenService.getToken('aCookie');

        const userStored = await userStorage.userByIse(ise);
        expect(userStored.firstConnectionDate.getTime()).toBeLessThan(userStored.lastConnectionDate.getTime());
    })

    test('when connection of an non existing user, and storage fail, then the user is not created', async () => {
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('aCookie', aWassupUser))
        userStorage.failWithError(new Error('some error in storage'))

        try {
            await tokenService.getToken('aCookie');
        } catch (e) {
        }

        userStorage.removeError();
        await expect(userStorage.userByIse(ise)).rejects.toThrow(new UserNotFoundInStorageWithIseError(aWassupUser.uid));
    })

    test('Throw error when user type is different to I', async () => {

        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('aCookie', new WassupUser(ise, 123, puid, 60, 1, 'machin@bidule.com')))
        try {
            await tokenService.getToken('aCookie');
            fail('should throw an exception')
        } catch (e) {
            expect(e).toEqual(new ForbiddenUserTypeError())
        }
    });

    test('Throw ForbiddenUserContractError when user is not a pro', async () => {
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('aCookie', new WassupUser(ise, 1, puid, 23, 1, 'machin@bidule.com')))
        try {
            await tokenService.getToken('aCookie');
            fail('should throw an exception')
        } catch (e) {
            expect(e).toEqual(new ForbiddenUserContractError())
        }
    });

    test('when user is a secondary account, on first connection create the user primary account', async () => {
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('aCookie', aWassupUser))
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('anotherCookie', aWassupUserPrimary))

        await tokenService.getToken('aCookie');

        expect((await userStorage.userByIse(puid))).toBeDefined();
        expect(userStorage.userInMemory.length).toEqual(2);
    })

    test('when user is a primary account, on first connection create just one user', async () => {
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('anotherCookie', aWassupUserPrimary))

        await tokenService.getToken('anotherCookie');

        expect(userStorage.userInMemory.length).toEqual(1);
    })
})
