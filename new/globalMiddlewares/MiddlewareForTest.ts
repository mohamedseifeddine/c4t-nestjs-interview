import {NextFunction, Request, Response} from "express";

export class MiddlewareForTest {
    public captureRequest = new Array<Request>();

    middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                this.captureRequest.push(req);
            } catch (e) {
                next(e)
            }
            next();
        }

    }
}
