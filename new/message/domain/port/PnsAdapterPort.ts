import { SessionInfoDto } from "../../types/types";

export interface PnsAdapterPort {
    notify(req: SessionInfoDto, userId: string,unreadSms: number,token:string):Promise<void>
}