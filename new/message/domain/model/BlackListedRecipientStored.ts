export class BlackListedRecipientStored {
    
        constructor(
            public readonly recipientNumber: string,
            public readonly userId: string,
            public readonly ctime: Date,
            public mtime: Date,
        ) {
        }
    }
    