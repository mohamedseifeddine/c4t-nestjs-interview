import { SessionInfoDto } from "../types/types";

export interface INotificationService{
    notifyUnread(sessionInfoDto: SessionInfoDto, userId:string,unreadSms: number):Promise<void>
}