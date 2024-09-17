import {DateProvider} from "../../../date-provider/DateProvider";
import {BlackListedRecipientStored} from "../../domain/model/BlackListedRecipientStored";
import {BlackListedRecipientStoragePort} from "../../domain/port/BlackListedRecipientStoragePort";

export class BlackListedRecipientStorageInMemory extends BlackListedRecipientStoragePort {
    public blackListInMemory: Array<BlackListedRecipientStored> = new Array<BlackListedRecipientStored>();

    async isBlackListed(recipientNumber: string, userId: string) {
        return this.blackListInMemory.filter(blackListedRecipient =>
            blackListedRecipient.recipientNumber === recipientNumber &&
            blackListedRecipient.userId === userId
        ).length > 0
    }

    async addBlaklistedRecipientForUser(recipientNumber: string, userId: string): Promise<void> {
        let ctime = DateProvider.now()
        let mtime = DateProvider.now()
        const blackListedRecipient = await this.getBlackListedRecipientForTest(recipientNumber, userId)
        if (blackListedRecipient) {
            blackListedRecipient.mtime = mtime
        } else {
            this.blackListInMemory.push(new BlackListedRecipientStored(recipientNumber, userId, ctime, mtime))
        }
        return Promise.resolve();
    }

    async getBlackListedRecipientForTest(recipientNumber: string, userId: string): Promise<BlackListedRecipientStored> {
        const blackListedRecipient = this.blackListInMemory.find(blackListedRecipient =>
            blackListedRecipient.recipientNumber === recipientNumber &&
            blackListedRecipient.userId === userId
        );
        return blackListedRecipient!;
    }

    async removeBlacklistedRecipientForUser(recipientNumber: string, userId: string): Promise<void> {
        this.blackListInMemory = this.blackListInMemory.filter(
            blackListedRecipient =>
                blackListedRecipient.recipientNumber !== recipientNumber ||
                blackListedRecipient.userId !== userId
        );
    }
}
