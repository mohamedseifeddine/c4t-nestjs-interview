import { DomainError } from "../../Error/DomainError";

export class DuplicateRecipientsError extends DomainError {
    constructor(){
        super(DuplicateRecipientsError.name,"Duplicate recipients. Each recipient must be unique");
    }
}