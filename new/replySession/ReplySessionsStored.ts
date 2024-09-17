export class ReplySessionsStored {

    constructor(
        public readonly virtualShortCodeId:string,
        public readonly message:string,
        public readonly recipient: string,
        public readonly user: string,
        public readonly notification: boolean,
        public  expireAt: Date,
        public readonly ctime: Date,
        public mtime: Date,
    ) {
    }
}

