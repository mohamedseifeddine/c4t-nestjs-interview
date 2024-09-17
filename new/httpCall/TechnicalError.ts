import { HttpError } from "./HttpError";

export class TechnicalError extends  HttpError {
    constructor() {
        super(500, 'TECHNICAL_ERROR', 'Something went wrong');
    }
}

