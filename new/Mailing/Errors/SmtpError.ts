import { DomainError } from "../../Error/DomainError";

export class SmtpError extends DomainError {
    constructor(mnemo: string, statusCode:number) {
        super(`${mnemo}  ${statusCode}`,'Something went wrong calling SMTP server');
    }
}