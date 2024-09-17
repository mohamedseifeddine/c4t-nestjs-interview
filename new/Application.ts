import cookieParser from 'cookie-parser';
import express from 'express';
import http from "http";
import mongoose from "mongoose";
import GeolocAdapter from './Geoloc/GeolocAdapter';
import GeolocMiddleware from './Geoloc/GeolocMiddleware';
import { ErrorMiddleware } from "./globalMiddlewares/ErrorMiddleware";
import { FormatRequestMiddleware } from "./globalMiddlewares/FormatRequestMiddleware";
import { HttpInboundLoggerMiddleware } from "./globalMiddlewares/HttpInboundLoggerMiddleware";
import { SessionInfoMiddleware } from "./globalMiddlewares/SessionInfoMiddleware";
import { SessionInfoStartMiddleware } from "./globalMiddlewares/SessionInfoStartMiddleware";
import { LoggerAdapter } from "./logger/LoggerAdapter";
import { MainRouter } from './MainRouter';
import { DatabaseConfigBuilder } from "./storage/DatabaseConfigBuilder";


export class Application {

    private closeCallback: (() => void) | undefined;

    private port = process.env.PORT || 3001;
    private server?: http.Server;
    private mongoClient?: mongoose.Mongoose
    private logger = new LoggerAdapter(Application);

    async start() {

        const app = express();
        this.mongoClient = await mongoose.connect(DatabaseConfigBuilder.loadConfig())

        app.use(cookieParser());
        app.use(new SessionInfoStartMiddleware().middleware)
        app.use(new FormatRequestMiddleware().middleware)
        app.use(new SessionInfoMiddleware().middleware)
        app.use(new HttpInboundLoggerMiddleware().middleware)
        app.use(new GeolocMiddleware(new GeolocAdapter()).middleware())
        app.use('/', new MainRouter(this.mongoClient).mainRouter);
        app.use(new ErrorMiddleware().middleware)

        this.server = app.listen(this.port, () => {
            this.logger.info(`Server listening on port ${this.port}`);

        });

        this.server?.on('close', async () => {
            await this.onClose();
        })

        // TODO return app for test - voir si on peu faire mieux
        return app;
    }

    async stop(callback?: () => void) {
        this.closeCallback = callback
        this.server?.close();
    }

    private async onClose() {
        this.logger.info('[onClose] stopping application')
        await this.mongoClient?.connection?.close();
        this.logger.info('[onClose] application stopped')
        if (this.closeCallback) {
            this.closeCallback();
        }
    }

}
