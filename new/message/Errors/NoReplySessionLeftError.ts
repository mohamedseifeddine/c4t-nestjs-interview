import { DomainError } from "../../Error/DomainError";

export class NoReplySessionLeftError extends DomainError {
    constructor(recepient: string) {
        super('NO_REPLY_SESSION_LEFT', `All sessions code have been tried, they are all busy for the recipient: ${recepient}`);
    }

    /*
    NoReplySessionLeftError.mnemo = 'NO_REPLY_SESSION_LEFT';
NoReplySessionLeftError.defaultMessage = 'All sessions code have been tried, they are all busy';
NoReplySessionLeftError.httpCode = 500;
     */
}
