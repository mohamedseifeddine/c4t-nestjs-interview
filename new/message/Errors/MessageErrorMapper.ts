import { DomainError } from "../../Error/DomainError";
import { ErrorMapper } from "../../httpCall/ErrorMapper.interface";
import { InternalErrorHttpError } from "../../httpCall/InternalErrorHttpError";
import { NotFoundHttpError } from "../../httpCall/NotFoundHttpError";
import { ConversationNotFoundError } from "./ConversationNotfound";
import { MessageNotFoundError } from "./MessageNotFoundError";

export class MessageErrorMapper implements ErrorMapper {

    mapDomainErrorToHttpError(error: DomainError) {
        switch (error.name) {
            case MessageNotFoundError.name:
                return new NotFoundHttpError("", error.message);
            case ConversationNotFoundError.name:
                return new NotFoundHttpError("", error.message);
            default:
                return new InternalErrorHttpError(error.message);
        }
    }
}
