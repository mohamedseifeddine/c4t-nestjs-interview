import express, {json, NextFunction, Request, Response, Router,} from "express";
import {UserErrorMapper} from "./Errors/UserErrorMapper";
import {MessageSignature} from "./MessageSignature";
import {UserService} from "./UserService";
import {UserStoragePort} from "./UserStoragePort";
import {EncryptedTokenMiddleware} from "../globalMiddlewares/EncryptedTokenMiddleware";
import {QuotaService} from "../quota/QuotaService";
import {UserInfosResponseApi} from "./UserInfosResponseApi";
import {UserInfos} from "./UserInfos";

class UserErrorMiddleware {
    static middleware(
        err: Error,
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        if (err) {
            const httpError = new UserErrorMapper().mapDomainErrorToHttpError(err);
            res.status(httpError.status).send({
                mnemo: httpError.mnemo,
                message: httpError.message,
            });
        } else {
            next(err);
        }
    }
}


export class UserRouter {
    public readonly router: Router;
    private userService: UserService;

    constructor(
        userStorage: UserStoragePort,
        quotaService: QuotaService
    ) {
        this.userService = new UserService(userStorage, quotaService);
        this.router = express.Router();
        this.router.use(json()); //use json() for read body
        this.router.use(EncryptedTokenMiddleware.middleware);
        this.router.get("/users/:userId", this.getUser.bind(this));
        this.router.patch("/users/:userId", this.updateUser.bind(this));
        this.router.get("/users/:userId/bundles", this.getEmptyBundleList.bind(this)); // this path is useless. use for compatibility with OMI
        this.router.use(UserErrorMiddleware.middleware);
    }

    private async getUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userInfos = await this.userService.userInfos(
                req.encryptedToken,
                req.params.userId
            );
            res.status(200).send(this.mapToUserInfosResponseApi(userInfos));
        } catch (e) {
            next(e);
        }
    }

    private async updateUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        const encryptedToken = req.encryptedToken;
        try {
            if (req.body.termsAccepted) {
                await this.userService.markTermsAccepted(
                    encryptedToken,
                    req.params.userId
                );
            }
            if (req.body.displayTutorial === false) {
                await this.userService.hideTutorial(encryptedToken, req.params.userId);
            }
            if (req.body.addSignatureToMessage !== undefined) {
                await this.userService.updateMessageSignature(
                    encryptedToken,
                    req.params.userId,
                    new MessageSignature(
                        req.body.addSignatureToMessage,
                        req.body.messageSignature ?? ""
                    )
                );
            }
            if (req.body.pinCode) {
                await this.userService.updatePinCode(
                    encryptedToken,
                    req.params.userId,
                    req.body.pinCode
                );
            }
            res.sendStatus(200);
        } catch (e) {
            next(e);
        }
    }

    mapToUserInfosResponseApi(userInfos: UserInfos) {
        return new UserInfosResponseApi(
            userInfos.wassupSpr,
            userInfos.wassupSau,
            userInfos.monthlyQuotaSendSms,
            userInfos.termsAccepted,
            userInfos.displayTutorial,
            userInfos.pinDefined,
            userInfos.pinLocked,
            userInfos.addSignatureToMessage,
            userInfos.messageSignature
        )

    }

    getEmptyBundleList(req: Request,
                       res: Response,
                       next: NextFunction
    ) {
        res.status(200).send([])
    }

}


//map UserInfo ver UserInfoResponse
// {
// 	"id": "632972a0fabdbe02229cdc8b",
// 	"wassup": {
// 		"uit": 1,
// 		"userType": "I",
// 		"sau": 0,
// 		"spr": 60,
// 		"pro": true,
// 		"ulo": "oopro.testmep60@orange.fr"
// 	},
// 	"pinDefined": true,
// 	"pinTries": 0,
// 	"pinLocked": false,
// 	"firstConnectionDate": "2022-09-20T07:58:24.931Z",
// 	"lastConnectionDate": "2024-07-09T09:09:12.870Z",
// 	"lastActivityDate": "2024-05-15T14:06:31.142Z",
// 	"termsAccepted": true,
// 	"displayTutorial": false,
// 	"ctime": "2022-09-20T07:58:24.852Z",
// 	"mtime": "2024-07-09T09:09:12.870Z",
// 	"addSignatureToMessage": true,
// 	"messageSignature": "De : Flanchec Yannic Rennes Cesson",
// 	"otp": {
// 		"remainingSendings": 5,
// 		"hasUnvalidatedOtp": false
// 	},
// 	"allocatedSpace": 52428800,
// 	"usedSpace": 1229,
// 	"dailyQuota": {
// 		"freeSmsLeft": 1,
// 		"freeMmsLeft": 1,
// 		"sentSms": 0,
// 		"sentMms": 0
// 	},
// 	"monthlyQuota": {
// 		"recipients": 0,
// 		"sentSms": 0,
// 		"sentMms": 0
// 	}
// }
