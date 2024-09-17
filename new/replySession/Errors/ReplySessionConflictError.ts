import { DomainError } from "../../Error/DomainError";

export class ReplySessionConflictError extends DomainError {
    constructor(virtualShortCodeId: string, recipient: string) {
        super(ReplySessionConflictError.name,`a reply session with virtualShortCodeId:${virtualShortCodeId} and recipient: ${recipient} already exists`);
    }
}
