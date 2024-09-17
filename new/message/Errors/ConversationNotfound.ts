import { DomainError } from "../../Error/DomainError";

export class ConversationNotFoundError extends DomainError {
    constructor(id:string){
        super(ConversationNotFoundError.name,`No conversation found for given id: ${id}`);
    }
}