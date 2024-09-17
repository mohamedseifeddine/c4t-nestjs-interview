import { HttpError } from "./HttpError";

export class ForbiddenHttpError extends HttpError {
    constructor(mnemo:string,message:string){
        super(403,mnemo,message)
    }
}