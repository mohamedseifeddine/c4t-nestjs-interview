import {LoggerAdapter} from "../../../logger/LoggerAdapter";
import {MessageStoragePort} from "../port/MessageStoragePort";
import {MessageNotFoundError} from "../../Errors/MessageNotFoundError";

export class XmsBrockerAcknowledgementService {

    private logger = new LoggerAdapter(XmsBrockerAcknowledgementService)

    constructor(private messageStorage: MessageStoragePort) {
    }

    async acknowledge(hubMessageId: string, acknoledgmentStatusCode: number) {
        const acknoledgmentStatus = this.xmsStatusList(acknoledgmentStatusCode)?.status

        if (acknoledgmentStatus !== 'error' && acknoledgmentStatus !== 'received') {
            this.logger.debug('not a final Status, no need to go further')
            return
        }

        try {
            const message = await this.messageStorage.messageByHubMessageId(hubMessageId)

            if (acknoledgmentStatus === 'error') {
                await this.messageStorage.updateSentMessageReceivedOnError(message.id, `xms_broker_${acknoledgmentStatusCode}`)
                return
            }
            await this.messageStorage.updateSentMessageReceivedOnSuccess(message.id)

        } catch (e) {
            if (e instanceof MessageNotFoundError) {
                this.logger.warn(`Unable to find a XMS matching the given XMS broker message ID : ${hubMessageId}`)
            } else {
                throw e
            }
        }
    }

    private xmsStatusList(xmsStatusCode: number) {

        switch (xmsStatusCode) {
            case -99:
                return {
                    status: 'error',
                    description: 'Destination address and originating address are identical'
                }
            case 0:
                return {
                    status: 'received',
                    description: 'Message delivered'
                }
            case 1:
                return {
                    status: 'error',
                    description: 'Server Message : absent subscriber'
                }
            case 2:
                return {
                    status: 'error',
                    description: 'Server Message : authentication error'
                }
            case 3:
                return {
                    status: 'error',
                    description: 'Server Message : command failure'
                }
            case 4:
                return {
                    status: 'sent',
                    description: 'Server Message command in progress'
                }
            case 5:
                return {
                    status: 'error',
                    description: 'Server Message : command rejected'
                }
            case 6:
                return {
                    status: 'sent',
                    description: 'Server Message : Message forwarded'
                }
            case 7:
                return {
                    status: 'error',
                    description: 'Server Message : service temporary not available'
                }
            case 8:
                return {
                    status: 'error',
                    description: 'Server Message : syntax error'
                }
            case 9:
                return {
                    status: 'error',
                    description: 'Server Message : system error'
                }
            case 10:
                return {
                    status: 'error',
                    description: 'Swapcom : abandoned message (retry max number reached)'
                }
            case 11:
                return {
                    status: 'error',
                    description: 'Swapcom : abandoned message (timetolive invalid)'
                }
            case 12:
                return {
                    status: 'error',
                    description: 'Swapcom : syntax message rejected'
                }
            case 13:
                return {
                    status: 'error',
                    description: 'Swapcom : system error'
                }
            case 14:
                return {
                    status: 'error',
                    description: 'Wavecom : busy'
                }
            case 15:
                return {
                    status: 'error',
                    description: 'Wavecom : processing error'
                }
            case 16:
                return {
                    status: 'error',
                    description: 'Wavecom : temporary network error or hardware error'
                }
            case 17:
                return {
                    status: 'error',
                    description: 'Wavecom : temporary network error or unknown AdC or syntax error'
                }
            case 26:
                return {
                    status: 'error',
                    description: 'Destination address and originating address are identicals'
                }
            case 27:
                return {
                    status: 'error',
                    description: 'Server Message : error unknown'
                }
            case 101:
                return {
                    status: 'error',
                    description: 'Absent subscriber'
                }
            case 102:
                return {
                    status: 'error',
                    description: 'Command rejected'
                }
            case 103:
                return {
                    status: 'error',
                    description: 'Error unknown'
                }
            case 104:
                return {
                    status: 'error',
                    description: 'Message expired'
                }
            case 105:
                return {
                    status: 'sent',
                    description: 'Message Syntax Error'
                }
            case 106:
                return {
                    status: 'error',
                    description: 'Mobile station application error'
                }
            case 107:
                return {
                    status: 'error',
                    description: 'Mobile station error'
                }
            case 108:
                return {
                    status: 'error',
                    description: 'Network error'
                }
            case 109:
                return {
                    status: 'sent',
                    description: 'Network failure'
                }
            case 110:
                return {
                    status: 'sent',
                    description: 'Service Temporary Not Available'
                }
            case 111:
                return {
                    status: 'error',
                    description: 'Syntax error'
                }
            case 112:
                return {
                    status: 'error',
                    description: 'TP-DCS rejected'
                }
            case 113:
                return {
                    status: 'error',
                    description: 'TP-DU rejected'
                }
            case 114:
                return {
                    status: 'error',
                    description: 'TP-PID rejected'
                }
            case 115:
                return {
                    status: 'error',
                    description: 'Unknown subscriber'
                }
            case 116:
                return {
                    status: 'error',
                    description: 'Carried subscriber'
                }
            case 117:
                return {
                    status: 'received',
                    description: 'Message read'
                }
            case 118:
                return {
                    status: 'received',
                    description: 'Message deleted'
                }
            case 119:
                return {
                    status: 'sent',
                    description: 'Message Intermediate State'
                }
            case 120:
                return {
                    status: 'sent',
                    description: 'Message Forwarded'
                }
        }
    }
}
