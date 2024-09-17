import {NextFunction, Request, Response} from "express";
import {v4 as uuidv4} from "uuid";
import {LoggerAdapter} from "../logger/LoggerAdapter";
import {EncryptedToken} from "../Token/EncryptedToken";

declare global {
    namespace Express {
        interface Request {
            remoteIp?: String,
            serviceId?: String,
            xForwardedFor?: String,
            id?: String,
            encryptedToken: EncryptedToken
        }
    }
}

export class FormatRequestMiddleware {

    middleware(req: Request, res: Response, next: NextFunction) {
        const logger = new LoggerAdapter(FormatRequestMiddleware);

        try {
            req.remoteIp = req.header('x-client-ip');
            if (req.remoteIp === undefined) {
                req.remoteIp = req.ip;
            }

            req.id = req.header('x-request-id');
            if (req.id === undefined) {
                req.id = uuidv4();
            }

            // TODO check if current ip is inside the list - voir Loic pour regarder peut-etre
            req.xForwardedFor = req.header('x-forwarded-for')
            if (req.xForwardedFor === undefined) {
                req.xForwardedFor = req.ip;
            }

            req.serviceId = req.header('x-xms-service-id')
        } catch (e: any) {
            logger.error(`error append with incoming req headers: ${JSON.stringify(req.headers)}, on path : ${JSON.stringify(req.path)} : %s`,
                e)
            next(e)
        }
        next();
    };
}
