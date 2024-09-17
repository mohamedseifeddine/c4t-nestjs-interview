import { DomainError } from "../../Error/DomainError";

export class MessageNotFoundError extends DomainError {
    constructor(){
        super(MessageNotFoundError.name,"Message not found");
    }
}

// ResourceNotFoundError.mnemo = 'RESOURCE_NOT_FOUND';
// ResourceNotFoundError.defaultMessage = 'Resource not found for given search param';
// ResourceNotFoundError.httpCode = 404;

// module.exports = ResourceNotFoundError;