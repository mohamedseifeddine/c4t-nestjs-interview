import { QuotaService } from "../../../quota/QuotaService";
import { User } from "../../../User/User";
import { UserStoragePort } from "../../../User/UserStoragePort";
import { FreeXmsLimitReachableError } from "../../Errors/FreeXmsLimitReachableError";
import { LockedAccountError } from "../../Errors/LockedAccountError";

export class MessageCapability {

    constructor(public readonly userStorage: UserStoragePort, public readonly quotaService: QuotaService) {
    }

    async checkCapabality(user: User, msgNumber: number, recipientList: Array<string>) {
        const freeMonthlyQuotas = 20;
        const dailyQuota = 250
        const monthlyQuota = 2000
        const maxSmsRecipients = 250

        const quota = await this.quotaService.sentSms(user);

        //check the master account in white list
        //if (req.masterAccount.whiteListed) {
        //  return;
        //}

        if (!user.hasUnlimitedOption() && quota.monthly + msgNumber > freeMonthlyQuotas) {
            throw new FreeXmsLimitReachableError()
        }
        if (msgNumber + quota.monthly > monthlyQuota) {
            throw new LockedAccountError(
                100,
                'Fraud suspicion: Monthly sendings. Too many XMS sent this month'
            );
        }
        if (recipientList.length + quota.monthlyRecipientNumber > maxSmsRecipients) {
            throw new LockedAccountError(
                100,
                'Fraud suspicion: Monthly SMS recipients. Too many SMS recipients this month'
            );
        }
        if (msgNumber + quota.daily > dailyQuota) {
            throw new LockedAccountError(
                100,
                'Fraud suspicion: Daily XMS sendings. Too many XMS sent today'
            );
        }
        if (this.areSuccessiveRecipients(recipientList)) {
            throw new LockedAccountError(
                100,
                'Fraud suspicion: Successive recipients. Successive recipients detected. It is seen as fraud'
            );
        }
    }

    private areSuccessiveRecipients(recipientList: Array<string>): Boolean {
        const maxSuccessiveRecipients = 5
        const successiveRecipient = recipientList.find((recipient) => {
            const withSameStart = recipientList.filter((item) => recipient.substring(0, 8) === item.substring(0, 8));

            return withSameStart.length > maxSuccessiveRecipients;
        });

        return Boolean(successiveRecipient);
    }
}


