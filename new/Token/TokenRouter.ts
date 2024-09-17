import express, {NextFunction, Request, Response, Router} from "express";
import {DomainError} from "../Error/DomainError";
import {UserStoragePort} from "../User/UserStoragePort";
import {LoggerAdapter} from "../logger/LoggerAdapter";
import {WassupAdapterPort} from "../wassup/WassupAdapterPort";
import {MissingWassupCookieError} from "./Errors/MissingWassupCookieError";
import {TokenErrorsMapper} from "./Errors/TokenErrorsMapper";
import TokenService from "./TokenService";

class TokenRouter {
    private tokenService: TokenService;
    public readonly router: Router;
    private logger = new LoggerAdapter(TokenRouter);
    private readonly tokenErrorsMapper: TokenErrorsMapper = new TokenErrorsMapper()

    constructor(wassupAdapter: WassupAdapterPort, userStorage: UserStoragePort) {
        this.tokenService = new TokenService(wassupAdapter, userStorage);
        this.router = express.Router();
        this.router.get('/token', this.getToken.bind(this));
    }

    private async getToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.debug(`TokenRouter >>>>> get token with cookie : ${req.cookies.wassup}`);
            if (!req.cookies.wassup) {
                throw new MissingWassupCookieError();
            }

            const token = await this.tokenService.getToken(req.cookies.wassup)
            res.send({
                token: token.encryptedValue(),
                expires: token.expiration.toISOString()
            });
        } catch (e) {
            const httpError = this.tokenErrorsMapper.mapDomainErrorToHttpError(e as DomainError);
            res.status(httpError.status).send({
                mnemo: httpError.mnemo,
                message: httpError.message,
            });
            next(e);
        }
    }
}

export default TokenRouter;
