
export default class Conversation {
    constructor(
        public readonly id: string,
        public readonly ctime: Date,
        public readonly mtime: Date,
        public readonly recipient: string,
        public readonly lastMessageContent: string,
        public readonly unread: number,
        public readonly messagesNumber: number,
        public readonly smsNumber: number  
    ) {

    }
}
