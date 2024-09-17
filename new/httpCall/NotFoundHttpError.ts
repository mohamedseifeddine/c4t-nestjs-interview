import { HttpError } from "./HttpError";

export class NotFoundHttpError extends HttpError {
    constructor(
        mnemo: string,
        message: string
    ) {
        mnemo = mnemo || "RESOURCE_NOT_FOUND";
        message = message || "Resource not found for given search param";
        super(404, mnemo, message);
    }
}