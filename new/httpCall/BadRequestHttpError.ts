import { HttpError } from "./HttpError";

export class BadRequestHttpError extends HttpError {
    constructor(mnemo:string,message:string){
        super(400,mnemo,message)
    }
}