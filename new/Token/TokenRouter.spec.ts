import cookieParser from "cookie-parser";
import express, { Express } from "express";
import request from "supertest";
import { UserStorageInMemory } from "../User/storageAdapter/UserStorageInMemory";
import { DateSimulator } from "../date-provider/DateSimulator";
import { WassupUser } from "../wassup/WassupUser";
import { WassupAdapterInMemory, WassupUserInMemory } from "../wassup/wassupAdapterInMemory";
import TokenRouter from "./TokenRouter";


describe('TokenRouter', () => {

    let app: Express
    let wassupAdapter: WassupAdapterInMemory;
    let userStorageInMemory: UserStorageInMemory;
    let tokenRouter: TokenRouter;
    let dateSimulator: DateSimulator;

    const aWassupUser = new WassupUser('aUid', 1, 'aPuid', 60, 1, 'machinSecondaire@bidule.com');
    const aWassupUserPrimary = new WassupUser('aPuid', 1, '', 60, 1, 'machin@bidule.com');

    beforeEach(() => {
        wassupAdapter = new WassupAdapterInMemory();
        userStorageInMemory = new UserStorageInMemory();
        tokenRouter = new TokenRouter(wassupAdapter, userStorageInMemory);
        app = express();
        app.use(cookieParser());
        app.use(tokenRouter.router);
        dateSimulator = new DateSimulator();
    })

    afterEach(() => {
        dateSimulator.restore()
    })

    test("return token", async () => {
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('aCookie', aWassupUser))
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('anotherCookie', aWassupUserPrimary))
        dateSimulator.dateIs("2024-02-13T09:11:41.453Z")

        const response = await request(app).get('/token').set('Cookie', ['wassup=aCookie']);

        expect(response.status).toBe(200);
        expect(JSON.parse(response.text).token).toBeDefined()
    })

    test('return Wassup error status with 401', async () => {

            const res = await request(app).get('/token').set('Cookie', ['wassup=aCookie'])

            expect(res.status).toBe(401);
            expect(res.body.mnemo).toBe('WASSUP_ERROR_STATUS');//mnemo
            expect(res.body.message).toBe('Wassup responded with an error status');//message
    })

    test('return MISSING_WASSUP_COOKIE with 401', async () => {

        const res = await request(app).get('/token')

        expect(res.status).toBe(401);
        expect(res.body.mnemo).toBe('MISSING_WASSUP_COOKIE');//mnemo
        expect(res.body.message).toBe('Wassup cookie is missing and required for authentication');//message
    })

    test('return FORBIDDEN_USER_TYPE with 403', async () => {

        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('aCookie', new WassupUser('ise', 123, 'aPuid', 60, 1, 'machin@bidule.com')))

        const res = await request(app).get('/token').set('Cookie', ['wassup=aCookie'])

        expect(res.status).toBe(403);
        expect(res.body.mnemo).toBe('FORBIDDEN_USER_TYPE');//mnemo
        expect(res.body.message).toBe('This type of user cannot access/use the requested feature');//message
    })

    test('return FORBIDDEN_USER_CONTRACT with 403', async () => {
        wassupAdapter.knowUserByCookie.push(new WassupUserInMemory('aCookie', new WassupUser('ise', 1, 'aPuid', 23, 1, 'machin@bidule.com')))

        const res = await request(app).get('/token').set('Cookie', ['wassup=aCookie'])

        expect(res.status).toBe(403);
        expect(res.body.mnemo).toBe('FORBIDDEN_USER_CONTRACT');//mnemo
        expect(res.body.message).toBe('The user contract cannot give access/use to the requested feature');//message
    })
})
