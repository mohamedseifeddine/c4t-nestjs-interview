import {LoggerAdapter} from "./LoggerAdapter";
import {DateProvider} from "../date-provider/DateProvider";
import {PartnerRequestInfoForLog} from "./PartnerRequestInfoForLog";
import {PartnerResponseInfoForLog} from "./PartnerResponseInfoForLog";
import {PartnerInfoForLog} from "./PartnerInfoForLog";

//
// debud, info et error doivent être appeler sur l'adapater, non sur le logger
// ne pas faire de child
// ou injecter le logger dans l'adapter.
// ou ...
//


export class PartnerLoggerAdapter extends LoggerAdapter {

    private startedCallAt?: Date;
    private partnerInfoForLog: PartnerInfoForLog;


    constructor(constructor: Function, partnerInfoForLog: PartnerInfoForLog) {
        super(constructor)
        this.partnerInfoForLog = partnerInfoForLog;

        this.logger = this.logger.child({
            log_type: 'partner',
            partner_id: this.partnerInfoForLog.partnerId,
        })
    }


    beforeCall(partnerRequestInfoForLog: PartnerRequestInfoForLog) {
        this.complementaryField = (logger: any) => {
            return logger.child(
                {
                    partnerReq: {
                        ...this.partnerInfoForLog.onBeforeCall(),
                        ...partnerRequestInfoForLog.onBeforeCall(),
                    }
                }
            )
        }

        this.debug(`Call ${this.partnerInfoForLog.partnerId}`)

        this.eraseComplementaryField()

        this.startedCallAt = DateProvider.now()
    }

    afterCall(partnerResponseInfoForLog: PartnerResponseInfoForLog) {
        if (this.startedCallAt === undefined) {
            throw new Error('Implementation error, beforeCall must be call before afterCall')
        }

        this.complementaryField = (logger: any) => {
            return logger.child(
                {
                    partnerReq: {
                        ...{
                            status: 'OK',
                            response_time: DateProvider.now().getTime() - this.startedCallAt!.getTime()
                        },
                        ...this.partnerInfoForLog.onAfterCall(),
                        ...partnerResponseInfoForLog.onAfterCall(),
                    }
                }
            )
        }
        this.info(`${this.partnerInfoForLog.partnerId} response`);
        this.eraseComplementaryField()
    }

    errorOnCall(partnerResponseInfoForLog: PartnerResponseInfoForLog) {
        if (this.startedCallAt === undefined) {
            throw new Error('Implementation error, beforeCall must be call before afterCall')
        }

        this.complementaryField = (logger: any) => {
            return logger.child(
                {
                    partnerReq: {
                        ...{
                            status: 'KO',
                            response_time: DateProvider.now().getTime() - this.startedCallAt!.getTime()
                        },
                        ...this.partnerInfoForLog.onErrorCall(),
                        ...partnerResponseInfoForLog.onAfterCall()
                    }
                }
            )
        }
        this.error(`${this.partnerInfoForLog.partnerId} error : ${partnerResponseInfoForLog.response}`);
        this.eraseComplementaryField()
    }
}
