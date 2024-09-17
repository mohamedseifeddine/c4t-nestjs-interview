export abstract class Message {
    public box = "inbox";
    public errorCode = '';
    public hubMessageId?: string;
    public read = false;
    public deleted = false;
    public deferred = false;
    public deferredDate: string = '';
    public deferredAck = false;
    public replyType: string = '';
    public replyNotification = false;
    public readonly subject: string = '';
    public readonly size: number = 1;
    public readonly messageHeader: string = '';

    public status = 'received';
    public receivedPackets: number = 1;
    public messagesNumber: number = 1;

    public recipient: string = '';
    public content: string = '';
    public sendingDate ?: Date = undefined;
}
