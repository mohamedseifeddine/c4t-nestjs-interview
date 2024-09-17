// TO be modified according to OMI
export class MessageConversation {
    constructor(
        public readonly id: string,
        public readonly box: string,
        public readonly size: number,
        public readonly messagesNumber: number,
        public readonly status: string,
        public readonly read: boolean,
        public readonly errorCode: string | null,
        public readonly billed: boolean,
        public readonly billingType: string,
        public readonly recipient: string,
        public readonly subject: string,
        public readonly deferred: boolean,
        public readonly deferredAck: boolean,
        public readonly replyType: string,
        public readonly replyNotification: boolean,
        public readonly sendingDate: Date | undefined,
        public readonly messageType: string,
        public readonly content: string,
        public readonly ctime: Date,
        public readonly mtime: Date,
        public readonly attachments: any[]
    ) {}
}