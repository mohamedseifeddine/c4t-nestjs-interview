import { DailyQuotaStoragePort } from "../quota/DailyQuotaStoragePort";
import { MonthlyQuotaStoragePort } from "../quota/MonthlyQuotaStoragePort";
import { QuotaService } from "../quota/QuotaService";
import { UserRouter } from "./UserRouter";
import { UserStoragePort } from "./UserStoragePort";

export class UserModule {
    static initUserRoute(userStorage: UserStoragePort,
        dailyQuotaStorage:DailyQuotaStoragePort,monthlyQuotaStorage:MonthlyQuotaStoragePort ){
        return new UserRouter(userStorage, new QuotaService(dailyQuotaStorage, monthlyQuotaStorage, userStorage)).router
    }
}