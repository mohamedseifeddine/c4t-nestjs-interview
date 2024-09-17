import { DomainError } from "../../Error/DomainError";

export class MailApiError extends DomainError {
    constructor(msg: string, statusCode:number) {
        super(MailApiError.name,`${msg}  ${statusCode}`);
    }
}