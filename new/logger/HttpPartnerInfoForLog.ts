import {PartnerInfoForLog} from "./PartnerInfoForLog";

export class HttpPartnerInfoForLog extends PartnerInfoForLog {
    constructor(
        partnerId: string,
        public readonly method: string,
        public readonly url: string,
        public readonly timeout: number) {
        super(partnerId)
    }

    onBeforeCall(): {} {
        return {
            url : this.url,
            method: this.method,
            timeout : this.timeout
        };
    }

    onAfterCall(){
        return {
            url : this.url,
            method: this.method,
        }
    }

    onErrorCall(){
        return {
            url : this.url,
            method: this.method,
        }
    }

}
