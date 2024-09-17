import { DomainError } from "../../Error/DomainError";
import { TokenServiceIdMismatchError } from "../../Token/Errors/TokenServiceIdMismatchError";
import { BadRequestHttpError } from "../../httpCall/BadRequestHttpError";
import { ErrorMapper } from "../../httpCall/ErrorMapper.interface";
import { ForbiddenHttpError } from "../../httpCall/FrobiddenHttpError";
import { InternalErrorHttpError } from "../../httpCall/InternalErrorHttpError";
import { NotFoundHttpError } from "../../httpCall/NotFoundHttpError";
import { UnauthorizedHttpError } from "../../httpCall/UnauthorizedHttpError";
import { BadUserIdError } from "./BadUserIdError";
import { ForbiddenSauError } from "./ForbiddenSauError";
import { UserCreationError } from "./UserCreationError";
import { UserNotFoundInStorageWithIseError } from "./UserNotFoundInStorageWithIseError";
import {UserNotFoundInStorageWithUserIdError} from "./UserNotFoundInStorageWithUserIdError";

export class UserErrorMapper implements ErrorMapper {

    mapDomainErrorToHttpError(error: DomainError) {
        switch (error.name) {
            case BadUserIdError.name:
                return new ForbiddenHttpError("BAD_USER_ID", error.message);
            case ForbiddenSauError.name:
                return new ForbiddenHttpError("FORBIDDEN_SAU", error.message);
            case UserNotFoundInStorageWithIseError.name:
                // mnemo to change
                return new NotFoundHttpError("CHANGE_ME", error.message);
            case UserNotFoundInStorageWithUserIdError.name:
                // mnemo to change
                return new NotFoundHttpError("CHANGE_ME", error.message);
            case UserCreationError.name:
                // mnemo to change
                return new BadRequestHttpError("CHANGE_ME", error.message);
            case TokenServiceIdMismatchError.name:
                return new UnauthorizedHttpError("TOKEN_SERVICE_ID_MISMATCH", error.message);
            default:
                return new InternalErrorHttpError(error.message);
        }
    }
}
