import {MessagePacket, MessageStored} from "./MessageStored"
import {DateProvider} from "../../../date-provider/DateProvider";

export class MessageStoredBuilder {
    private recipient = ""
    private user = "558e97d7f3a1fb023055c1d1"
    private deferred = false
    private deferredDate = ""
    private deferredAck = false
    private subject = ""
    private box = ""
    private size = 10
    private receivedPackets = 1
    private messagesNumber = 1
    private status = ""
    private errorCode = ""
    private replyType = ""
    private replyNotification = false
    private content = ""
    private messageHeader = ""
    private hubMessageId = ""
    private deleted = false
    private ctime = DateProvider.now()
    private mtime = DateProvider.now()
    private sendingDate = DateProvider.now()
    private id = "123456789"
    private read = false
    private packets: Array<MessagePacket> = []

    withDestinationPhoneNumber(destinationPhoneNumber: string) {
        this.recipient = destinationPhoneNumber
        return this;
    }

    withId(id: string) {
        this.id = id
        return this;
    }

    withUserId(userId: string) {
        this.user = userId;
        return this;
    }

    build(): MessageStored {
        const message = new MessageStored(
            this.recipient,
            this.user,
            this.deferred,
            this.deferredDate,
            this.deferredAck,
            this.subject,
            this.box,
            this.size,
            this.receivedPackets,
            this.messagesNumber,
            this.status,
            this.errorCode,
            this.replyType,
            this.replyNotification,
            this.content,
            this.messageHeader,
            this.hubMessageId,
            this.deleted,
            this.ctime,
            this.mtime,
            this.sendingDate,
            this.id,
            this.read,
            this.packets
        );

        return message;
    }

    withStatus(status: string) {
        this.status = status;
        return this;
    }

    withReceivedPackets(receivedPackets: number) {
        this.receivedPackets = receivedPackets;
        return this;
    }

    withBox(box: string) {
        this.box = box;
        return this;
    }

    withSize(size: number) {
        this.size = size;
        return this;
    }

    withSendingDate(date: Date) {
        this.sendingDate = date;
        return this;
    }

    withRecipient(recipient: string) {
        this.recipient = recipient;
        return this;
    }

    withPackets(messagePackets: MessagePacket[]) {
        this.packets = messagePackets;
        return this;
    }

    withMessagesNumber(messagesNumber: number) {
        this.messagesNumber = messagesNumber;
        return this;
    }

    withHubMessageId(hubMessageId: string) {
        this.hubMessageId = hubMessageId;
        return this;
    }
}
