import {MonthlyQuotaStored} from "./MonthlyQuotaStored";

export interface MonthlyQuotaStoragePort {
    quotaForUser(userId: string): Promise<MonthlyQuotaStored>;

    incrementSentSmsForUser(userId: string, inc:number, recipients:Array<string>): Promise<void>;
}
