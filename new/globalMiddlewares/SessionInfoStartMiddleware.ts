import * as cls from "cls-hooked";
import {NextFunction, Request, Response} from "express";
import {LoggerAdapter} from "../logger/LoggerAdapter";

export class SessionInfoStartMiddleware {
    private static session: any = cls.createNamespace('session')

    middleware(req: Request, res: Response, next: NextFunction) {
        const logger = new LoggerAdapter(SessionInfoStartMiddleware);
        SessionInfoStartMiddleware.session.run(() => {
            next();

            logger.debug('Session Middleware context count : %s',
                SessionInfoStartMiddleware.session._contexts.size);
        });
    }
}
