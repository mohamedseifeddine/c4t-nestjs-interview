import express, {Express} from 'express';
import request from "supertest";
import {MiddlewareForTest} from "./MiddlewareForTest";
import {FormatRequestMiddleware} from "./FormatRequestMiddleware";

describe('FormatRequestMiddleware', () => {

    let middlewareForTest: MiddlewareForTest;
    let app: Express;

    beforeEach(() => {
        middlewareForTest = new MiddlewareForTest();
        app = express();
        app.use(new FormatRequestMiddleware().middleware)
        app.use(middlewareForTest.middleware());
    })

    test('copy x-client-ip to remoteIp if define', async () => {
        const remoteIp = '1.2.3.4'

        await request(app).get('/').set('x-client-ip', remoteIp);

        expect(middlewareForTest.captureRequest[0].remoteIp).toEqual(remoteIp)
    })

    test('copy ip to remoteIp if x-client-ip is not define', async () => {

        await request(app).get('/');

        expect(middlewareForTest.captureRequest[0].remoteIp).toEqual('::ffff:127.0.0.1')
    })

    test('copy x-request-id to id if define', async () => {
        const requestId = '1234'

        await request(app).get('/').set('x-request-id', requestId);

        expect(middlewareForTest.captureRequest[0].id).toEqual(requestId)
    })

    test('use unique id if when x-request-id is not define ', async () => {

        await request(app).get('/');

        expect(middlewareForTest.captureRequest[0].id).toBeDefined()
    })

    test('copy x-xms-service-id to serviceId', async () => {
        const serviceId = 'testService'

        await request(app).get('/').set('x-xms-service-id', serviceId);

        expect(middlewareForTest.captureRequest[0].serviceId).toEqual(serviceId)
    })

    test('copy x-forwarded-for to xForwardedFor', async () => {
        const xForwardedFor = '10.117.31.6, 10.77.118.3'

        await request(app).get('/').set('x-forwarded-for', xForwardedFor);

        expect(middlewareForTest.captureRequest[0].xForwardedFor).toEqual(xForwardedFor)
    })

    test('copy ip to xForwardedFor if x-forwarded-for is not define', async () => {

        await request(app).get('/');

        expect(middlewareForTest.captureRequest[0].xForwardedFor).toEqual('::ffff:127.0.0.1')
    })
})
