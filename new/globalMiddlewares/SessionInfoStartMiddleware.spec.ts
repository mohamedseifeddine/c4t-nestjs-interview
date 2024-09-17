import express, {Express, NextFunction, Request, Response} from 'express';
import request from "supertest";
import {SessionInfoStartMiddleware} from "./SessionInfoStartMiddleware";
import {SessionInfo} from "./SessionInfo";

class CaptureSessionInfoMiddleware {

    public sessionId?: string;

    capture() {
        return (req: Request, res: Response, next: NextFunction) => {
            this.sessionId = SessionInfo.sessionId()
            next();
        }
    }

}

describe("SessionInfoStartMiddleware", () => {
    let app: Express;
    let captureSessionInfoMiddleware: CaptureSessionInfoMiddleware;

    beforeEach(() => {
        app = express();
        app.use(new SessionInfoStartMiddleware().middleware)
        captureSessionInfoMiddleware = new CaptureSessionInfoMiddleware();
        app.get('/', captureSessionInfoMiddleware.capture())
        app.get('/trucs/:id', captureSessionInfoMiddleware.capture())
    })

    test("create session", async () => {
        await request(app).get('/');

        expect(captureSessionInfoMiddleware.sessionId).toBeDefined()
    })
})
