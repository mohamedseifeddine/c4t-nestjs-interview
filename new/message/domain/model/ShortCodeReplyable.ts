import {ShortCode} from "./ShortCode";

export class ShortCodeReplyable extends ShortCode {
    constructor(
        public readonly senderAddress: string,
        public readonly virtualShortCode: Array<string>,
        public readonly odiAuthorization: string) {
        super();
    }
}
