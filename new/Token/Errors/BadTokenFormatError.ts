import { DomainError } from "../../Error/DomainError";

export class BadTokenFormatError extends DomainError {
    constructor(){
        super(BadTokenFormatError.name,"Unable to parse and decipher token")
    }
}
/*
BadTokenFormatError.mnemo = 'BAD_TOKEN_FORMAT';
BadTokenFormatError.defaultMessage = 'Given token couldn\'t auth a user';
BadTokenFormatError.httpCode = 401;
 */
