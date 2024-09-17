import { ShortCode } from "./ShortCode";

export class ShortCodeInternational extends ShortCode {
    constructor(public readonly senderAddress: string,public readonly virtualShortCode: Array<string>,public readonly odiAuthorization: string) {
        super();
    }
}
