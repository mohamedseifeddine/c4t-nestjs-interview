import { HttpError } from "./HttpError";

export class UnauthorizedHttpError extends HttpError {
    constructor(mnemo:string,message:string){
        super(401,mnemo,message)
    }
}