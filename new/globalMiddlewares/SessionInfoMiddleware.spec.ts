import express, {Express, NextFunction, Request, Response} from 'express';
import request from "supertest";
import {FormatRequestMiddleware} from "./FormatRequestMiddleware";
import {SessionInfo} from "./SessionInfo";
import {SessionInfoStartMiddleware} from "./SessionInfoStartMiddleware";
import {SessionInfoMiddleware} from "./SessionInfoMiddleware";


class CaptureSessionInfoMiddleware {

    public remoteIp?: string;
    public sessionId?: string;
    public requestId?: string;
    public serviceId?: string;
    public path?: string;
    public pathName?: string;
    public method?: string;
    public xForwardFor?: string;

    capture() {
        return (req: Request, res: Response, next: NextFunction) => {
            this.remoteIp = SessionInfo.remoteIp()
            this.requestId= SessionInfo.requestId()
            this.serviceId=SessionInfo.serviceId()
            this.xForwardFor=SessionInfo.xForwardedFor()
            this.path=SessionInfo.path()
            this.pathName=SessionInfo.pathName()
            this.method=SessionInfo.method()

            next();
        }
    }

}

describe("SessionInfoMiddleware", () => {
    let app: Express;
    let captureSessionInfoMiddleware: CaptureSessionInfoMiddleware;

    beforeEach(() => {
        app = express();
        app.use(new SessionInfoStartMiddleware().middleware)
        app.use(new FormatRequestMiddleware().middleware)
        app.use(new SessionInfoMiddleware().middleware)
        captureSessionInfoMiddleware = new CaptureSessionInfoMiddleware();
        app.get('/', captureSessionInfoMiddleware.capture())
        app.get('/users/:id', captureSessionInfoMiddleware.capture())
        app.get('/users/:id/bundles', captureSessionInfoMiddleware.capture())
        app.get('/users/:id/messages', captureSessionInfoMiddleware.capture())
        app.get('/users/:id/messages/:id', captureSessionInfoMiddleware.capture())
        app.get('/users/:id/conversations', captureSessionInfoMiddleware.capture())
        app.get('/users/:id/conversations/:id', captureSessionInfoMiddleware.capture())
        app.get('/users/:id/conversations/:id/messages', captureSessionInfoMiddleware.capture())
    })

    test("store remoteIp in session", async () => {
        const expectedRemoteIp = '1.2.3.4';

        await request(app).get('/').set('x-client-ip', expectedRemoteIp);

        expect(captureSessionInfoMiddleware.remoteIp).toEqual(expectedRemoteIp)
    })

    test("store request id in session", async () => {
        const expectedRequestId = '11';

        await request(app).get('/').set('x-request-id', expectedRequestId);

        expect(captureSessionInfoMiddleware.requestId).toEqual(expectedRequestId)
    })

    test("store service Id in session", async () => {
        const expectedServiceId = '1';

        await request(app).get('/').set('x-xms-service-id', expectedServiceId);

        expect(captureSessionInfoMiddleware.serviceId).toEqual(expectedServiceId)
    })

    test("store x-forward-for in session", async () => {
        const expectedServiceId = '1.2.3.4, 2.3.4.5';

        await request(app).get('/').set('x-forwarded-for', expectedServiceId);

        expect(captureSessionInfoMiddleware.xForwardFor).toEqual(expectedServiceId)
    })

    test("store path in session", async () => {
        const expectedPath = '/';

        await request(app).get(expectedPath);

        expect(captureSessionInfoMiddleware.path).toEqual(expectedPath)
    })

    test("store full path in session", async () => {
        const expectedPath = '/users/123';

        await request(app).get(expectedPath);

        expect(captureSessionInfoMiddleware.path).toEqual(expectedPath)
    })

    test("store method in session", async () => {

        await request(app).get('/');

        expect(captureSessionInfoMiddleware.method).toEqual('GET')
    })

    test("store the userId alone in anonymous path name in session", async () => {

        await request(app).get('/users/123');

        expect(captureSessionInfoMiddleware.pathName).toEqual('/users/{userId}')
    })

    test("store the userId between sub-rout bundles in anonymous path name in session", async () => {

        await request(app).get('/users/123/bundles');

        expect(captureSessionInfoMiddleware.pathName).toEqual('/users/{userId}/bundles')
    })

    test("store the userId between sub-rout messages in anonymous path name in session", async () => {

        await request(app).get('/users/123/messages');

        expect(captureSessionInfoMiddleware.pathName).toEqual('/users/{userId}/messages')
    })

    test("store the messageId on sub-rout messages in anonymous path name in session", async () => {

        await request(app).get('/users/123/messages/567');

        expect(captureSessionInfoMiddleware.pathName).toEqual('/users/{userId}/messages/{messageId}')
    })

    test("store the userId on sub-rout conversation in anonymous path name in session", async () => {

        await request(app).get('/users/123/conversations');

        expect(captureSessionInfoMiddleware.pathName).toEqual('/users/{userId}/conversations')
    })

    test("store the conversationId on sub-rout conversation in anonymous path name in session", async () => {

        await request(app).get('/users/123/conversations/567');

        expect(captureSessionInfoMiddleware.pathName).toEqual('/users/{userId}/conversations/{conversationId}')
    })

    test("store the conversationId on sub-rout conversation message in anonymous path name in session", async () => {

        await request(app).get('/users/123/conversations/567/messages');

        expect(captureSessionInfoMiddleware.pathName).toEqual('/users/{userId}/conversations/{conversationId}/messages')
    })

})
