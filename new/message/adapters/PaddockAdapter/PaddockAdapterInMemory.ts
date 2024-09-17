import { OdiInvalidClientError } from "../../Errors/OdiInvalidClientError";
import { PaddockBadFormatPhoneNumberError } from "../../Errors/PaddockBadFormatPhoneNumberError";
import { PaddockNoContentError } from "../../Errors/PaddockNoContentError";
import { PaddockPartnerError } from "../../Errors/PaddockPartnerError";
import { ShortCode } from "../../domain/model/ShortCode";
import { PaddockAdapterPort } from "../../domain/port/PaddockAdapterPort";

class MessageSent {
    constructor(
        public readonly shortcode: string,
        public readonly destinationPhoneNumber: string,
        public readonly message: string) {
    }

}

export class PaddockAdapterInMemory implements PaddockAdapterPort {
    public messagesSent = new Array<MessageSent>

    sendSMS(shortcode: ShortCode, messageContent: string, destinationPhoneNumber: string): Promise<string> {
        if(messageContent.length==0){
            throw new PaddockNoContentError()
        }
        if (!destinationPhoneNumber.match(/^\+\d+$/)) {
            throw new PaddockBadFormatPhoneNumberError(destinationPhoneNumber)
        }
        if (destinationPhoneNumber.length > 16) {
            throw new PaddockPartnerError('Request failed with status code 400')
        }
        if (shortcode.odiAuthorization.length < 50) {
            throw new OdiInvalidClientError()
        }
        this.messagesSent.push(new MessageSent(shortcode.virtualShortCode[0], destinationPhoneNumber, messageContent))
        return Promise.resolve("aHubMessageId");
    }
}
