import {Message} from "./Message";

export class ReceivingMessage extends Message {

    public box = "inbox";
    public errorCode = '';
    public hubMessageId?:string = undefined;
    public read = false;
    public deleted=false;
    public deferred = false;
    public deferredDate = '';
    public deferredAck = false;
    public replyType:string = '';
    public replyNotification = false;

    public status = 'received';
    public receivedPackets: number = 1;
    public messagesNumber: number = 1;

    constructor(
        public readonly recipient: string,
        public readonly content: string,
        public readonly sendingDate : Date
    ) {
        super()
    }
}
