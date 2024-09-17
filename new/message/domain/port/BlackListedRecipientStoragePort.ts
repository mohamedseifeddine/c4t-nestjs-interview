import { BlackListedRecipientStored } from "../model/BlackListedRecipientStored";

export abstract class BlackListedRecipientStoragePort {
    abstract isBlackListed(recipientNumber: string, userId:string): Promise<Boolean>;
    abstract addBlaklistedRecipientForUser(recipientNumber: string, userId: string): Promise<void>;
    abstract getBlackListedRecipientForTest(recipientNumber: string, userId: string):Promise<BlackListedRecipientStored>;
    abstract removeBlacklistedRecipientForUser(recipientNumber: string, userId: string):Promise<void>
}
