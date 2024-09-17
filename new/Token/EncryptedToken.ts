/*
TokenServiceIdMismatchError.mnemo = 'TOKEN_SERVICE_ID_MISMATCH';
TokenServiceIdMismatchError.defaultMessage = 'The token service ID is not the one of the request';
TokenServiceIdMismatchError.httpCode = 401;
 */
import { CryptoService } from "../crypto/CryptoService";
import { LoggerAdapter } from "../logger/LoggerAdapter";
import { BadTokenFormatError } from "./Errors/BadTokenFormatError";
import { ExpiredTokenError } from "./Errors/ExpiredTokenError";
import { TokenServiceIdMismatchError } from "./Errors/TokenServiceIdMismatchError";
import { Token } from "./Token";

export class EncryptedToken {

    private logger = new LoggerAdapter(EncryptedToken)

    constructor(private encryptedValue: string, private sessionServiceId: string) {

    }

    uid() {
        let data: string[];
        try {
            data = CryptoService.decryptValue(this.encryptedValue).split('|');
        } catch (e: any) {
            this.logger.error('Error while decrypting token : %s', e)
            throw new BadTokenFormatError()
        }

        const token = this.parseToken(data)

        return token.uid;
    }

    private parseToken(data: string[]) {
        if (data.length !== 3) {
            throw new BadTokenFormatError()
        }
        const decryptedToken = new Token(data[0], data[1], new Date(data[2]))
        if (decryptedToken.isExpired()) {
            throw new ExpiredTokenError();
        }
        if (decryptedToken.serviceId !== this.sessionServiceId) {
            this.logger.debug(`TokenServiceIdMismatchError with tokenServiceId = ${decryptedToken.serviceId} and sessionServiceId = ${this.sessionServiceId}`)
            throw new TokenServiceIdMismatchError();
        }
        return decryptedToken;
    }
}
