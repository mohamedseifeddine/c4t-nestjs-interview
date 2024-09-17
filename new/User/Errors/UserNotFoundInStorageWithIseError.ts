import { DomainError } from "../../Error/DomainError";

export class UserNotFoundInStorageWithIseError extends DomainError {
    constructor(ise: string) {
        super(UserNotFoundInStorageWithIseError.name,`User with ise : ${ise} is not found in storage`);
    }
}
