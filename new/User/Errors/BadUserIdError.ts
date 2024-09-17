import { DomainError } from "../../Error/DomainError";

export class BadUserIdError implements DomainError {
    message = `The given userId doesn't match the one authenticated by token (hence by wassup cookie)`;
    name = 'BadUserIdError';
    /*
    BadUserIdError.mnemo = 'BAD_USER_ID';
BadUserIdError.defaultMessage = 'The given userId doesn\'t match the one authenticated by token (hence by wassup cookie)';
BadUserIdError.httpCode = 401;
     */
}
