import {ReplySessionsNotFoundInStorageError} from "../../../replySession/Errors/ReplySessionsNotFoundInStorageError";
import {ReplySessionsStoragePort} from "../../../replySession/ReplySessionsStoragePort";
import {ShortCodeConfig} from "../../adapters/ShortCodeConfigBuilder";
import {NoReplySessionLeftError} from "../../Errors/NoReplySessionLeftError";
import {MessageStored} from "../model/MessageStored";
import {PhoneNumberService} from "./PhoneNumberService";
import {LoggerAdapter} from "../../../logger/LoggerAdapter";

export class ShortCodeService {
    private logger = new LoggerAdapter(ShortCodeService)

    constructor(private shortCodeConfig: ShortCodeConfig, private replySessionsStorage: ReplySessionsStoragePort) {
    }

    async findAvailableShortCode(destinationPhoneNumber: string, replyable: boolean, message: MessageStored) {
        if (!PhoneNumberService.isMetropolitanFrenchNumber(destinationPhoneNumber)) {
            this.logger.debug('find an international number, return shortcode : %s', this.shortCodeConfig.shortCodeInternational)
            return this.shortCodeConfig.shortCodeInternational;
        }
        if (!replyable) { //case for delais (manage by code), internationnal (manage by code) and explicit noreply
            this.logger.debug('find a non replayable sending, return shortcode : %s', this.shortCodeConfig.shortCodeNoReply)
            return this.shortCodeConfig.shortCodeNoReply
        }

        for (const shortCode of this.shortCodeConfig.shortCodesReplyables) {
            this.logger.debug(`search reply session for : ${shortCode.senderAddress} and ${message.recipient}`)
            try {
                const replySession = await this.replySessionsStorage.replySessions(shortCode.senderAddress, message.recipient)
                this.logger.debug('find one : %s %s %s %s %s', replySession.virtualShortCodeId, replySession.recipient, replySession.expireAt, replySession.ctime, replySession.mtime)
            } catch (e) {
                if (e instanceof ReplySessionsNotFoundInStorageError) {
                    this.logger.debug('find a replayable sending, return shortcode : %s', shortCode.senderAddress)
                    await this.replySessionsStorage.createReplySessions(shortCode.senderAddress, message)
                    return shortCode
                }
            }
        }
        throw new NoReplySessionLeftError(message.recipient)
    }
}
