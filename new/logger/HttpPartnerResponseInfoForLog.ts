import {PartnerResponseInfoForLog} from "./PartnerResponseInfoForLog";

export class HttpPartnerResponseInfoForLog extends PartnerResponseInfoForLog {
    constructor(
        public readonly statusCode: number,
        public readonly response: string,
        public readonly respSize: number) {
        super()
    }

    onAfterCall() {
        return {
            status_code: this.statusCode,
            resp: this.response,
            response_size: this.respSize,
        }
    }
}
