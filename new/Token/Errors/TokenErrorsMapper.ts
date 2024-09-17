import { DomainError } from "../../Error/DomainError";
import { ErrorMapper } from "../../httpCall/ErrorMapper.interface";
import { ForbiddenHttpError } from "../../httpCall/FrobiddenHttpError";
import { InternalErrorHttpError } from "../../httpCall/InternalErrorHttpError";
import { UnauthorizedHttpError } from "../../httpCall/UnauthorizedHttpError";
import { WassupUnknownUserError } from "../../wassup/WassupUnknownUserError";
import { ForbiddenUserContractError } from "./ForbiddenUserContractError";
import { ForbiddenUserTypeError } from "./ForbiddenUserTypeError";
import { MissingWassupCookieError } from "./MissingWassupCookieError";

export class TokenErrorsMapper implements ErrorMapper {

    mapDomainErrorToHttpError(error:DomainError){
        switch(error.name){
            case WassupUnknownUserError.name:
                return new UnauthorizedHttpError("WASSUP_ERROR_STATUS",'Wassup responded with an error status')
            case MissingWassupCookieError.name:
                return new UnauthorizedHttpError("MISSING_WASSUP_COOKIE",'Wassup cookie is missing and required for authentication')
            case ForbiddenUserTypeError.name:
                return new ForbiddenHttpError("FORBIDDEN_USER_TYPE",'This type of user cannot access/use the requested feature')
            case ForbiddenUserContractError.name:
                return new ForbiddenHttpError("FORBIDDEN_USER_CONTRACT",'The user contract cannot give access/use to the requested feature')
            default:
                return new InternalErrorHttpError(error.message);
        }
    }
}
