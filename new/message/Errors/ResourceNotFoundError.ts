import { DomainError } from "../../Error/DomainError";

interface ResourceNotFoundErrorDetails {
    details: {
        resourceName: string;
        id: string;
    };
    message: string;
}

export class ResourceNotFoundError extends DomainError {
    constructor({ details, message }: ResourceNotFoundErrorDetails) {
        super(ResourceNotFoundError.name, `${message}: ${details.id}`);
    }
}
