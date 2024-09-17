import express from "express";
import mongoose from "mongoose";
import healthRouter from "./Health/HealthRouter";
import TokenRouter from "./Token/TokenRouter";
import UserStorage from "./User/storageAdapter/UserStorage";
import WassupAdapter from "./wassup/WassupAdapter";

import { MessageModule } from "./message/MessageModule";
import { DailyQuotaStorage } from "./quota/storageAdapter/DailyQuotaStorage";
import { MonthlyQuotaStorage } from "./quota/storageAdapter/MonthlyQuotaStorage";
import { MongoClientWithLog } from "./storage/MongoClientWithLog";
import { UserModule } from "./User/UserModule";

export class MainRouter {

    public readonly mainRouter = express.Router()

    constructor(mongoClient: mongoose.Mongoose) {
        const mongoClientWithLog = new MongoClientWithLog(mongoClient);
        const userStorage = new UserStorage(mongoClientWithLog);
        const dailyQuotaStorage = new DailyQuotaStorage(mongoClientWithLog);
        const monthlyQuotaStorage = new MonthlyQuotaStorage(mongoClientWithLog);

        this.mainRouter.use(healthRouter);
        this.mainRouter.use(new TokenRouter(new WassupAdapter(), userStorage).router)
        this.mainRouter.use(UserModule.initUserRoute(userStorage,dailyQuotaStorage,monthlyQuotaStorage))
        this.mainRouter.use(MessageModule.initMessageRouter(mongoClientWithLog,userStorage,dailyQuotaStorage,monthlyQuotaStorage))
        this.mainRouter.use(MessageModule.initConversationRouter(mongoClientWithLog,userStorage))
        this.mainRouter.use(MessageModule.initXmsBrockerRouter(mongoClientWithLog,userStorage))
    }

}
