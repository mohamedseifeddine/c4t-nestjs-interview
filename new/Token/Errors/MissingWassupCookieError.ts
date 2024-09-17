import { DomainError } from "../../Error/DomainError";

export class MissingWassupCookieError extends DomainError {
    constructor(){
        super('MissingWassupCookieError','')
    }
}