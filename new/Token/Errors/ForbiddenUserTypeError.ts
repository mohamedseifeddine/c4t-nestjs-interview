import { DomainError } from "../../Error/DomainError";

export class ForbiddenUserTypeError extends DomainError  {
    constructor() {
        super(ForbiddenUserTypeError.name,"This type of user cannot access/use the requested feature");
    }
}
