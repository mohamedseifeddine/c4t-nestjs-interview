import express, {Express, Request, Response} from 'express';
import {HttpInboundLoggerMiddleware} from './HttpInboundLoggerMiddleware';
import request from 'supertest';
import {LogsStreamInMemory} from "../logger/LogsStreamInMemory";
import {LoggerAdapter} from "../logger/LoggerAdapter";

describe('HttpInboundLoggerMiddleware', () => {
    let app: Express;
    let logStream: LogsStreamInMemory;
    let logger: LoggerAdapter;

    beforeEach(() => {
        logStream = new LogsStreamInMemory();
        LoggerAdapter.logStream = logStream;
        logger = new LoggerAdapter(LoggerAdapter);
        app = express();
        app.use(new HttpInboundLoggerMiddleware().middleware);
    })

    test('log inbound request http', async () => {
        const expectedLog = {
            method: "GET",
            url: "/"
        }
        app.get('/', (req: Request, res: Response) => {
            res.sendStatus(200);
        });

        await request(app).get('/');

        expect(logStream.logs[0].msg).toEqual(`request: ${JSON.stringify(expectedLog)}`)
    });

    test('log inbound response http', async () => {
        const expectedRequest = {
            method: "GET",
            url: "/"
        }
        const expectedResponse = {status: 202, statusMessage: "Accepted"};
        app.get('/', (req: Request, res: Response) => {
            // simulate an asynchronous implementation
            setTimeout(() => {
                res.sendStatus(202);
            }, 1)
        });

        await request(app).get('/');

        expect(logStream.logs[1].msg).toEqual(`request: ${JSON.stringify(expectedRequest)} - response: ${JSON.stringify(expectedResponse)}`)
    });

});
