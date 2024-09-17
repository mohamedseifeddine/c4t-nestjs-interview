import express, {Request} from "express";
import {ErrorMiddleware} from "./ErrorMiddleware";
import request from "supertest";
import {LogsStreamInMemory} from "../logger/LogsStreamInMemory";
import {LoggerAdapter} from "../logger/LoggerAdapter";

class FaillueMiddleware {
    public captureRequest = new Array<Request>();

    middleware() {
        return () => {
            throw new Error('an Error')
        }
    }
}

describe('ErrorMiddleware', () => {

    test('log fails with unmanaged error', async () => {
        const logStream = new LogsStreamInMemory();
        LoggerAdapter.logStream = logStream;
        const app = express();
        app.use(new FaillueMiddleware().middleware());
        app.use(new ErrorMiddleware().middleware)

        await request(app).get('/')

        expect(logStream.logs[0].msg).toEqual("fails with unmanaged error : \"an Error\"")
    })

})
