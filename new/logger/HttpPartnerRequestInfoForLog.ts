import {PartnerRequestInfoForLog} from "./PartnerRequestInfoForLog";

export class HttpPartnerRequestInfoForLog extends PartnerRequestInfoForLog {
    constructor(public readonly headers: {}, public readonly detail: {}) {
        super()
    }

    onBeforeCall() {
        return {
            headers: this.headers,
            details: this.detail
        }
    }

}
