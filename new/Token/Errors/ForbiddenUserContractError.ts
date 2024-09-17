import { DomainError } from "../../Error/DomainError";

export class ForbiddenUserContractError extends DomainError {
    constructor() {
        super(ForbiddenUserContractError.name,"This user is not a pro");
    }
}
