import {DateProvider} from "../../date-provider/DateProvider";
import {DateTime} from 'luxon';
import {MonthlyQuotaStoragePort} from "../MonthlyQuotaStoragePort";
import {MonthlyQuotaStored} from "../MonthlyQuotaStored";

export class MonthlyQuotaStorageInMemory implements MonthlyQuotaStoragePort {
    private storage: Map<string, {
        user: string,
        sentSms: number,
        smsRecipientList: Array<string>,
        ctime: Date
    }> = new Map();

    async quotaForUser(userId: string) {
        this.resetOnExpiration(userId)
        const userData = this.storage.get(userId);
        if (userData) {
            return new MonthlyQuotaStored(userData.sentSms, userData.smsRecipientList.length);
        } else {
            return new MonthlyQuotaStored(0, 0);
        }
    }

    async incrementSentSmsForUser(userId: string, inc: number, recipients: Array<string>) {
        this.resetOnExpiration(userId)
        if (this.storage.has(userId)) {
            this.storage.get(userId)!.sentSms += inc;
            recipients.forEach(recipient => {
                if (this.storage.get(userId)!.smsRecipientList.indexOf(recipient) === -1) {
                    this.storage.get(userId)!.smsRecipientList.push(recipient)
                }
            })
        } else {
            this.storage.set(userId, {
                user: userId,
                sentSms: inc,
                smsRecipientList: recipients,
                ctime: DateProvider.now()
            });
        }
    }

    private resetOnExpiration(userId: string) {
        if (this.storage.has(userId)) {
            const now = DateTime.fromJSDate(DateProvider.now());
            const ctime = DateTime.fromJSDate(this.storage.get(userId)!.ctime);
            const oneMonthAgo = now.minus({months: 1});

            if (ctime < oneMonthAgo) {
                this.storage.set(userId, {
                    user: userId,
                    sentSms: 0,
                    smsRecipientList: [],
                    ctime: now.toJSDate()
                });
            }
        }
    }

}
