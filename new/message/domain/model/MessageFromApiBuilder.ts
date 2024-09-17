import { MessageFromApi } from "./MessageFromApi";

export class MessageFromApiBuilder {
    private recipient: string[] = [];
    private deferredDate = ''
    private deferredAck = true
    private subject = 'aSubject'
    private replyType = 'inbox'
    private replyNotification = true
    private content = 'aMessage'
    private messageHeader = 'sending'

    withContent(content: string) {
        this.content = content
        return this
    }

    withDestinationPhoneNumber(destinationPhoneNumber: string) {
        this.recipient.push(destinationPhoneNumber)
        return this;
    }

    withDifferedDate(date: string) {
        this.deferredDate = date;
        return this;
    }

    withReplyType(replytType: string) {
        this.replyType = replytType;
        return this;
    }

    withReplyNotification(replyNotification: boolean) {
        this.replyNotification = replyNotification;
        return this;
    }

    withHeader(header: string) {
        this.messageHeader = header
        return this;
    }

    build() {
        return new MessageFromApi(
            this.recipient,
            this.deferredDate,
            this.deferredAck,
            this.subject,
            this.replyType,
            this.replyNotification,
            this.content,
            this.messageHeader
        )
    }
}
