export interface DailyQuotaStoragePort {
    sentSmsForUser(userId: string): Promise<any>;

    incrementSentSmsForUser(userId: string,inc:number): Promise<void>;
}
