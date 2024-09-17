import {NextFunction, Request, Response} from "express";
import {LoggerAdapter} from "../logger/LoggerAdapter";

export class ErrorMiddleware {
    middleware(err: Error, req: Request, res: Response, next: NextFunction) {
        const logger = new LoggerAdapter(ErrorMiddleware);
        if (err) {
            logger.error('fails with unmanaged error : %s', err.message);
            next(err);
        }
    }
}
