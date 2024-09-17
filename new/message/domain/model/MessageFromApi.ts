export class MessageFromApi {

    constructor(
        public readonly destinationPhoneNumbers: Array<string>,
        public readonly deferredDate: string,
        public readonly deferredAck: boolean,
        public readonly subject: string,
        public readonly replyType: string,
        public readonly replyNotification: boolean,
        public readonly content: string,
        public readonly messageHeader: string
    ) {

    }
}
