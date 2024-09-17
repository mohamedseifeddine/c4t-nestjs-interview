import {DomainError} from "../../Error/DomainError";

export class ReplySessionsNotFoundInStorageError extends DomainError {
    constructor(virtualShortCodeId: string, recepient: string) {
        super(ReplySessionsNotFoundInStorageError.name, `Reply session with shortcode : ${virtualShortCodeId} and recepient : ${recepient} is not found in storage`);
    }
}
