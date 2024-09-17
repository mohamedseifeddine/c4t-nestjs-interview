import { DomainError } from "../../Error/DomainError";

export class ExpiredTokenError  extends DomainError {
    constructor(){
        super(ExpiredTokenError.name,"Token has expired")
    }
}
/*
ExpiredTokenError.mnemo = 'EXPIRED_TOKEN';
ExpiredTokenError.defaultMessage = 'Token has expired';
ExpiredTokenError.httpCode = 401;
 */
