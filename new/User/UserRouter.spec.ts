/*
patch /user/:userId

{
  "pinCode": "123456",   // check user.isBehindBox
}
// semble mettre à jour : user.lastActivityDate
 voir l'usage rapport à lastConnectionDate
 voir où c'est utilisé dans le code

// 204 : No content
400 : bad request
401 : unauthorisez acces
403 : acces forbiden
409 conflict
423 : Locked


exemple d'appelle d'omi sur patch :
patch('/users/me', {
                pinCode
            })

ADD some log in storage check existant

*/
//////


/*
/user/*  le ExecuteOperationHook fait plusieurs check pour ce chemin

check user.termsAccepted
sauf pour CL, get /user/userId et patch /user/userId

check pinCode
sauf pour get /user/userId et patch /user/userId et post /user/userId/pincode
 */

import cookieParser from "cookie-parser";
import express, {Express} from "express";
import request from "supertest";
import {Token} from "../Token/Token";
import {CryptoService} from "../crypto/CryptoService";
import {FormatRequestMiddleware} from "../globalMiddlewares/FormatRequestMiddleware";
import {SessionInfoStartMiddleware} from "../globalMiddlewares/SessionInfoStartMiddleware";
import {QuotaService} from "../quota/QuotaService";
import {DailyQuotaStorageInMemory} from "../quota/storageAdapter/DailyQuotaStorageInMemory";
import {MonthlyQuotaStorageInMemory} from "../quota/storageAdapter/MonthlyQuotaStorageInMemory";
import {SetUpUserForTest} from "./SetUpUserForTest";
import {UserRouter} from "./UserRouter";
import {UserStorageInMemory} from "./storageAdapter/UserStorageInMemory";
import {UserInfosResponseApi} from "./UserInfosResponseApi";
import {SessionInfoMiddleware} from "../globalMiddlewares/SessionInfoMiddleware";


describe('UserRouter', () => {
    const puid = 'aPuid'
    const uid = 'aUid'

    let app: Express
    let userRouter: UserRouter;
    let userStorage: UserStorageInMemory;
    let monthlyQuotaStorage: MonthlyQuotaStorageInMemory;
    let dailyQuotaStorage: DailyQuotaStorageInMemory;

    beforeEach(() => {
        monthlyQuotaStorage = new MonthlyQuotaStorageInMemory();
        dailyQuotaStorage = new DailyQuotaStorageInMemory();
        userStorage = new UserStorageInMemory();
        userRouter = new UserRouter(userStorage, new QuotaService(dailyQuotaStorage, monthlyQuotaStorage, userStorage));
        app = express();
        app.use(cookieParser());
        app.use(new SessionInfoStartMiddleware().middleware)
        app.use(new FormatRequestMiddleware().middleware)
        app.use(new SessionInfoMiddleware().middleware);
        app.use(userRouter.router);
    })

    test('get /user path return user informations', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        const response = await request(app).get('/users/me')
            .set('authorization', new Token('aServiceId', uid).encryptedValue())
            .set('x-xms-service-id', 'aServiceId');

        expect(response.status).toBe(200);
        expect(JSON.parse(response.text)).toEqual(
            new UserInfosResponseApi(
                60,
                1,
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

    test('get /users/me/bundles path return a empty list', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        const response = await request(app).get('/users/me/bundles')
            .set('authorization', new Token('aServiceId', uid).encryptedValue())
            .set('x-xms-service-id', 'aServiceId');

        expect(response.status).toBe(200);
        expect(JSON.parse(response.text)).toEqual([])
    })


    test('update terms accepted return 200 and update user', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        const patchResponse = await request(app).patch('/users/me')
            .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
            .set('x-xms-service-id', 'aServiceId')
            .send({termsAccepted: true})

        expect(patchResponse.status).toEqual(200)
        const resp = await request(app).get('/users/me')
            .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
            .set('x-xms-service-id', 'aServiceId');
        expect(JSON.parse(resp.text).termsAccepted).toEqual(true)
    })

    test('update display tutorial return 200 and update user', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        const patchResponse = await request(app).patch('/users/me')
            .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
            .set('x-xms-service-id', 'aServiceId')
            .send({displayTutorial: false})

        expect(patchResponse.status).toEqual(200)
        const resp = await request(app).get('/users/me')
            .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
            .set('x-xms-service-id', 'aServiceId');
        expect(JSON.parse(resp.text).displayTutorial).toEqual(false)
    })

    test('add signture with message return 200 and update user', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        const patchResponse = await request(app).patch('/users/me')
            .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
            .set('x-xms-service-id', 'aServiceId')
            .send({
                addSignatureToMessage: true,
                messageSignature: "aSignature"
            })

        expect(patchResponse.status).toEqual(200)
        const resp = await request(app).get('/users/me')
            .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
            .set('x-xms-service-id', 'aServiceId');
        expect(JSON.parse(resp.text).addSignatureToMessage).toEqual(true)
        expect(JSON.parse(resp.text).messageSignature).toEqual("aSignature")
    })

    test('add signature without message set an empty message signature', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        const patchResponse = await request(app).patch('/users/me')
            .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
            .set('x-xms-service-id', 'aServiceId')
            .send({
                addSignatureToMessage: true
            })

        expect(patchResponse.status).toEqual(200)
        const resp = await request(app).get('/users/me')
            .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
            .set('x-xms-service-id', 'aServiceId');
        expect(JSON.parse(resp.text).addSignatureToMessage).toEqual(true)
        expect(JSON.parse(resp.text).messageSignature).toEqual("")
    })

    test('update pin code for a user', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60)

        const patchResponse = await request(app).patch('/users/me')
            .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
            .set('x-xms-service-id', 'aServiceId')
            .send({
                pinCode: "1234"
            })
        const userStored = await userStorage.userByIse('aUid')

        expect(patchResponse.status).toEqual(200)
        expect(CryptoService.checkValueAgainstHash(userStored.pinCode, '1234')).toEqual(true)
    })

    test('wip:fail update pin code', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid, 60, 2)

        const patchResponse = await request(app).patch('/users/me')
            .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
            .set('x-xms-service-id', 'aServiceId')
            .send({
                pinCode: "1234"
            })

        expect(patchResponse.status).toEqual(403)
        expect(patchResponse.body.mnemo).toEqual('FORBIDDEN_SAU');
        expect(patchResponse.body.message).toEqual('Users are not allowed to change their PIN code if they are not behind their livebox');
    })

    describe.each([
        ['get', (param: string) => request(app!).get(param)],
        ['patch', (param: string) => request(app!).patch(param)]
    ])('Errors cases for method %s', (methodeName, method) => {

        test(`${methodeName} /user return error 401 when authorization header is missing`, async () => {
            const response = await method('/users/me');

            expect(response.status).toEqual(401);
            expect(response.body.mnemo).toEqual('MISSING_AUTHORIZATION_BEARER');
            expect(response.body.message).toEqual('Authorization bearer is missing and required for authentication');
        })

        test(`${methodeName}  /user return 403 error with wrong userId `, async () => {
            const response = await method('/users/123')
                .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
                .set('x-xms-service-id', 'aServiceId')
                .send({displayTutorial: false});

            expect(response.status).toEqual(403);
            expect(response.body.mnemo).toEqual('BAD_USER_ID');
            expect(response.body.message).toEqual('The given userId doesn\'t match the one authenticated by token (hence by wassup cookie)');
        })

        test(`${methodeName}  /user return 401 error with wrong serviceId `, async () => {
            const response = await method('/users/me')
                .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
                .set('x-xms-service-id', 'anotherServiceId')
                .send({displayTutorial: false});

            expect(response.status).toEqual(401);
            expect(response.body.mnemo).toEqual('TOKEN_SERVICE_ID_MISMATCH');
            expect(response.body.message).toEqual('The token service ID is not the one of the request');
        })

        test(`${methodeName} /user return 404 error when userId not define`, async () => {
            const response = await method('/users')
                .set('authorization', new Token('aServiceId', 'aUid').encryptedValue())
                .set('x-xms-service-id', 'aServiceId');

            expect(response.status).toEqual(404);
        })

    })
})
