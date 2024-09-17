import { ShortCode } from "./ShortCode";

export class ShortCodeNoReply extends ShortCode {
    constructor(public readonly senderAddress: string, public readonly virtualShortCode: Array<string>, public readonly odiAuthorization: string) {
        super()
    }
}
