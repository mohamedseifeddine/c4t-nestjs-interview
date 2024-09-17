import { DomainError } from "../../Error/DomainError";

export class UserNotFoundInStorageWithUserIdError extends DomainError {
    constructor(userId: string) {
        super(UserNotFoundInStorageWithUserIdError.name,`User with id : ${userId} is not found in storage`);
    }
}
