import {NextFunction, Request, Response} from "express";
import {EncryptedToken} from "../Token/EncryptedToken";
import {SessionInfo} from "./SessionInfo";

export class EncryptedTokenMiddleware {
    static middleware(req: Request, res: Response, next: NextFunction) {
        const authorization = req.header("authorization");
        if (authorization === undefined) {
            res.status(401).send({
                mnemo: "MISSING_AUTHORIZATION_BEARER",
                message:
                    "Authorization bearer is missing and required for authentication",
            });
            return;
        }
        const encryptedToken = authorization.replace(/^Bearer /, "").trim();
        req.encryptedToken = new EncryptedToken(
            encryptedToken,
            SessionInfo.serviceId()
        );
        next();
    }
}
