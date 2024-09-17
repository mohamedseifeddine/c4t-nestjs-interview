import {DateProvider} from "../../../date-provider/DateProvider";
import {Message} from "./Message";

export class SendingMessage extends Message {


    public box = "outbox";
    public sendingDate = DateProvider.now();

    constructor(
        public readonly recipient: string,
        public readonly deferred: boolean,
        public readonly deferredDate: string,
        public readonly deferredAck: boolean,
        public readonly subject: string,
        public readonly size: number,
        public status: string,
        public readonly replyType: string,
        public readonly replyNotification: boolean,
        public readonly content: string,
        public readonly messageHeader: string,
        public readonly messagesNumber: number
    ) {
        super()
    }
}
