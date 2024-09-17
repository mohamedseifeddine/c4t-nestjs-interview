import { SendingMessage } from "../model/SendingMessage";
import { MessageConversation } from "../model/messageConversation";
import { MessageFromApi } from "../model/MessageFromApi";
import { MessageStored } from "../model/MessageStored";
import { PhoneNumberService } from "../service/PhoneNumberService";

export class SendingMessageParser {

    static toMessageToSend(message: MessageFromApi) {

        const unitMessages = message.destinationPhoneNumbers.map(phoneNumber => {
            const isMetroFrenchNum = PhoneNumberService.isMetropolitanFrenchNumber(phoneNumber)

            const replyType = this.replyType(message, isMetroFrenchNum);

            let messageContent = this.formatMessageContent(message.content)

            return new SendingMessage(
                phoneNumber,
                Boolean(message.deferredDate),
                message.deferredDate,
                message.deferredAck,
                message.subject,
                messageContent.length,
                message.deferredDate ? 'deferred' : 'sending',
                replyType,
                !isMetroFrenchNum ? false : message.replyNotification,
                messageContent,
                message.messageHeader,
                this.messagesNumber(this.concatContent(message.messageHeader, messageContent, replyType), replyType),
            )
        })
        return unitMessages
    }

    private static concatContent(messageHeader: string, messageContent: string, replyType: string) {
        const header = messageHeader.length > 0 ? `${messageHeader}\n` : ''
        return header + messageContent + this.messageFooter(replyType);
    }

    private static replyType(message: MessageFromApi, isMetroFrenchNum: boolean) {
        return message.deferredDate || !isMetroFrenchNum ? 'noreply' :
            message.replyType.length > 0 ? message.replyType : 'inbox';
    }

    private static messagesNumber(content: string, replyType: string) {
        let nbCharsSecondPacket = 0;
        const nbCharsForUDH = 7;
        let smsLength = 0;
        let nbCharsTmp = 0;
        const maxSmsCharacters = 160
        let characters = 0

        // special characters which count for more than one
        const specialChar: any = {
            charCodeAt: [10, 91, 92, 93, 94, 123, 124, 125, 126, 8364],
            data: {
                // enter
                10: {length: 4},
                // [
                91: {length: 2},
                // \
                92: {length: 2},
                // ]
                93: {length: 2},
                // ^
                94: {length: 2},
                // {
                123: {length: 2},
                // |
                124: {length: 2},
                // }
                125: {length: 2},
                // ~
                126: {length: 2},
                // euro currency symbol
                8364: {length: 3}
            }
        };
        const message = content || '';

        // Calculating the size of the message, taking into account special characters
        for (let i = 0; i < message.length; i++) {
            if (message.charCodeAt(i) in specialChar.data) {
                nbCharsTmp += specialChar.data[message.charCodeAt(i)].length;
            } else if (message.charCodeAt(i) !== 13) {
                // ENTER key is composed by 2 chars with IE (10+13)
                nbCharsTmp += 1;
            }
        }

        smsLength = nbCharsTmp;
        const nbChars = smsLength;

        let nbSMS = Math.ceil(smsLength / maxSmsCharacters);

        if (replyType === 'inbox' && nbChars > 0) {
            // Reply inbox
            nbCharsSecondPacket = smsLength - maxSmsCharacters;
        } else {
            // temporary number of characters for better understanding of the algorithm
            nbCharsSecondPacket = nbChars - maxSmsCharacters;
        }

        // case: number of packets = 1
        if (smsLength <= maxSmsCharacters && nbChars > 0) {
            nbSMS = 1;
            // case: number of packets = 2, nbCharsSecondPacket starts from the last character of the first packet
        } else if (nbCharsSecondPacket > 0 &&
            nbCharsSecondPacket <= (maxSmsCharacters - 2 * nbCharsForUDH)) {
            smsLength += 2 * nbCharsForUDH;
            nbSMS = 2;
            // case: number of packets > 2,
        } else {
            nbSMS = Math.ceil(
                (nbCharsSecondPacket - (maxSmsCharacters - 2 * nbCharsForUDH)) /
                (maxSmsCharacters - nbCharsForUDH)
            ) + 2;
            smsLength += nbSMS * nbCharsForUDH;
        }

        characters = smsLength;
        return nbSMS;
    }

    private static messageFooter(replyType: string) {
        if (replyType === 'inbox')
            return '\n>Répondez par SMS';
        return ''
    }

    private static formatMessageContent(content: string) {
        return content.replace('\r\n', '\n')
    }
    static mapMessageStoredToConversation(messageStored: MessageStored): MessageConversation {
        return new MessageConversation(
            messageStored.id,
            messageStored.box,
            messageStored.size,
            SendingMessageParser.messagesNumber(messageStored.content,messageStored.replyType),
            messageStored.status,
            messageStored.read,
            messageStored.errorCode,
            false,
            "",
            messageStored.recipient,
            messageStored.subject,
            messageStored.deferred,
            messageStored.deferredAck,
            messageStored.replyType,
            messageStored.replyNotification,
            messageStored.sendingDate,
            "sms",
            messageStored.content,
            new Date(messageStored.ctime),
            new Date(messageStored.mtime),
            []
        );
    }
}
