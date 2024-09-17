import {NextFunction, Request, Response} from "express";
import {SessionInfo} from "./SessionInfo";
import {LoggerAdapter} from "../logger/LoggerAdapter";

export class SessionInfoMiddleware {

    middleware(req: Request, res: Response, next: NextFunction) {
        try {
            SessionInfo.storeRemoteIp(req.remoteIp)
            SessionInfo.storeRequestId(req.id)
            SessionInfo.storeServiceId(req.serviceId)
            SessionInfo.storeXForwardedFor(req.xForwardedFor)
            SessionInfo.storePath(req.path)
            SessionInfo.storePathName(SessionInfoMiddleware.anonymePath(req.path))
            SessionInfo.storeMethod(req.method)
        }
        catch(e){
            const logger = new LoggerAdapter(SessionInfoMiddleware)
            logger.error('fails with unmanaged error : %s',
                e);
            next(e)
        }
        next();
    }

    private static anonymePath(path: string) {

        const usersPath = path.replace(/(users)\/([0-9a-zA-Z]*)/g, 'users/{userId}');
        const messagesPath = usersPath.replace(/(messages)\/([0-9a-zA-Z]*)/g, 'messages/{messageId}');
        const conversationPath = messagesPath.replace(/(conversations)\/([0-9a-zA-Z]*)/g, 'conversations/{conversationId}');
        return conversationPath
    }
}
