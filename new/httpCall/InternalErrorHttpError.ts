import { HttpError } from "./HttpError";

export class InternalErrorHttpError extends HttpError {
    constructor(message:string){
        super(500,"INTERNAL_ERROR",message)
    }
}