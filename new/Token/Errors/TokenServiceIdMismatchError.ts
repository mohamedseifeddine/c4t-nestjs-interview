import { DomainError } from "../../Error/DomainError";

export class TokenServiceIdMismatchError extends DomainError {
    constructor(){
        super(TokenServiceIdMismatchError.name,"The token service ID is not the one of the request")
    }
}
/*
TokenServiceIdMismatchError.mnemo = 'TOKEN_SERVICE_ID_MISMATCH';
TokenServiceIdMismatchError.defaultMessage = 'The token service ID is not the one of the request';
TokenServiceIdMismatchError.httpCode = 401;
 */
