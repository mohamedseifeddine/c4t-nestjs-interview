import {NextFunction, Request, Response} from 'express';
import {LoggerAdapter} from "../logger/LoggerAdapter";

export class HttpInboundLoggerMiddleware {

    middleware(req: Request, res: Response, next: NextFunction) {
        const logger = new LoggerAdapter(HttpInboundLoggerMiddleware)
        logger.info('request: %s', {method: req.method, url: req.url});
        res.on('finish', () => {
            logger.info('request: %s - response: %s',
                {method: req.method, url: req.url},
                {status: res.statusCode, statusMessage: res.statusMessage});
        });
        next();

    }
}
