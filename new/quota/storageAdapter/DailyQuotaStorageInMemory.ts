import {DailyQuotaStoragePort} from "../DailyQuotaStoragePort";
import {DateProvider} from "../../date-provider/DateProvider";

export class DailyQuotaStorageInMemory implements DailyQuotaStoragePort {
    private storage: Map<string, { user: string, sentSms: number, ctime: Date }> = new Map();

    async sentSmsForUser(userId: string) {
        this.resetOnExpiration(userId)
        const userData = this.storage.get(userId);
        if (userData) {
            return userData.sentSms;
        } else {
            return 0;
        }
    }

    async incrementSentSmsForUser(userId: string, inc: number) {
        this.resetOnExpiration(userId)
        if (this.storage.has(userId)) {
            this.storage.get(userId)!.sentSms += inc;
        } else {
            this.storage.set(userId, {user: userId, sentSms: inc, ctime: DateProvider.now()});
        }
    }

    private resetOnExpiration(userId: string) {
        if (this.storage.has(userId)) {
            const _24hourBeforeNow = DateProvider.now().getTime() - 24 * 60 * 60 * 1000;
            if (this.storage.get(userId)!.ctime.getTime() < _24hourBeforeNow) {
                this.storage.set(userId, {user: userId, sentSms: 0, ctime: DateProvider.now()});
            }
        }
    }
}
