import { HttpError } from "./HttpError";

export class PnsPartnerError extends HttpError {
    constructor(
        message: string,
        mnemo?: string,
    ) {
        mnemo = mnemo || "PNS_ERROR";
        message = message || "Something went wrong calling PnS server";
        super(500, mnemo, message);
    }
}