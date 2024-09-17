export class MessagePacket {
    constructor(
        public readonly msgId: string,
        public readonly packetId: number,
        public readonly content: string
    ) {
    }
}

export class MessageStored {

    constructor(
        public readonly recipient: string,
        public readonly user: string,
        public readonly deferred: boolean,
        public readonly deferredDate: string,
        public readonly deferredAck: boolean,
        public readonly subject: string,
        public readonly box: string,
        public size: number,
        public receivedPackets: number,
        public readonly messagesNumber: number,
        public  status: string,
        public  errorCode: string,
        public readonly replyType: string,
        public readonly replyNotification: boolean,
        public content: string,
        public readonly messageHeader: string,
        public  hubMessageId: string|undefined,
        public deleted: boolean,
        public readonly ctime: Date,
        public mtime: Date,
        public sendingDate: Date | undefined,
        public readonly id: string,
        public read: boolean = false,
        public packets: Array<MessagePacket> = []
    ) {}
}
