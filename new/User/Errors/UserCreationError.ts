import { DomainError } from "../../Error/DomainError";

export class UserCreationError extends DomainError {
    constructor(message: string) {
        super(UserCreationError.name,`Error creating user: ${message}`);
    }
}