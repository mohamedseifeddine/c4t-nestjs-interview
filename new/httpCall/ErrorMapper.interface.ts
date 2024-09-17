import { DomainError } from "../Error/DomainError";
import { HttpError } from "./HttpError";

export interface ErrorMapper {
     mapDomainErrorToHttpError(error:DomainError):HttpError
}
