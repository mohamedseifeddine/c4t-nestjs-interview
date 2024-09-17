import {SendingMessage} from "./SendingMessage";

export class SendingMessageBuilder {

    private recipient: string = '';
    private deferred: boolean = false;
    private deferredDate: string = '';
    private deferredAck: boolean = false;
    private subject: string = '';
    private size: number = 0;
    private status: string = '';
    private replyType: string = '';
    private replyNotification: boolean = false;
    private content: string = '';
    private messageHeader: string = '';
    private messagesNumber: number = 1;
    private box: string = 'inbox';
    private read: boolean = false;
    private deleted: boolean = false;
    private hubMessageId: string|undefined = undefined

    withContent(content: string) {
        this.content = content
        return this
    }

    withBox(box: string) {
        this.box = box;
        return this;
    }

    withDestinationPhoneNumber(destinationPhoneNumber: string) {
        this.recipient = destinationPhoneNumber
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

    withStatus(status: string) {
        this.status = status;
        return this;
    }

    withDeleted(deleted: boolean) {
        this.deleted = deleted;
        return this;
    }

    withRead(read: boolean) {
        this.read = read;
        return this;
    }

    withSize(size: number) {
        this.size = size;
        return this;
    }

    whithHubMessageId(hubMessageId: string) {
        this.hubMessageId = hubMessageId
        return this;
    }

    build(): SendingMessage {
        const message = new SendingMessage(
            this.recipient,
            this.deferred,
            this.deferredDate,
            this.deferredAck,
            this.subject,
            this.size,
            this.status,
            this.replyType,
            this.replyNotification,
            this.content,
            this.messageHeader,
            this.messagesNumber
        );
        message.box = this.box;
        message.read = this.read;
        message.deleted = this.deleted
        message.hubMessageId = this.hubMessageId
        return message;
    }


}
