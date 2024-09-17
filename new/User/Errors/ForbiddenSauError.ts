import { DomainError } from "../../Error/DomainError";

export class ForbiddenSauError implements DomainError {
    message = 'Users are not allowed to change their PIN code if they are not behind their livebox';
    name = 'ForbiddenSauError';
/*ForbiddenSauError.mnemo =
'FORBIDDEN_SAU'
;
ForbiddenSauError.defaultMessage =
'Users are not allowed to change their PIN code if they are not behind their livebox'
;
ForbiddenSauError.httpCode =
403;*/ 
}