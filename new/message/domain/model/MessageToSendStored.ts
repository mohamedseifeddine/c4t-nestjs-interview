export class MessageToSendStored {

    constructor(
        public message: string,
        public requestedSendingDate: string,
        public status: string,
        public ack: boolean,
        public tries: number = 0,
        public readonly ctime: Date,
        public mtime: Date,

    ) {
    }
}
