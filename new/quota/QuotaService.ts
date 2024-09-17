import {DailyQuotaStoragePort} from "./DailyQuotaStoragePort";
import {MonthlyQuotaStoragePort} from "./MonthlyQuotaStoragePort";
import {User} from "../User/User";
import {UserStoragePort} from "../User/UserStoragePort";
import {Quota} from "./Quota";

export class QuotaService {

    constructor(private dailyQuotaStorage: DailyQuotaStoragePort, private monthlyQuotaStorage: MonthlyQuotaStoragePort, private userStorage: UserStoragePort) {
    }

    async sentSms(user: User) {
        const primaryUser = await this.primaryAccount(user);
        const monthlyQuotaStored = await this.monthlyQuotaStorage.quotaForUser(primaryUser.id);
        return new Quota(
            await this.dailyQuotaStorage.sentSmsForUser(primaryUser.id),
            monthlyQuotaStored.sentSms,
            monthlyQuotaStored.recipientNumber,
        )
    }

    async incrementSentSmsForUser(user: User, messagesNumber: number, ...recipient:Array<string>) {
        const primaryUser = await this.primaryAccount(user);
        await this.monthlyQuotaStorage.incrementSentSmsForUser(primaryUser.id, messagesNumber, recipient)
        await this.dailyQuotaStorage.incrementSentSmsForUser(primaryUser.id, messagesNumber)
    }

    private async primaryAccount(user: User) {
        if (user.isPrimaryAccount()) {
            return user
        }
        return await this.userStorage.userByIse(user.puid)
    }
}
