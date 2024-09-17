import { OkapiAdapterPort } from "../adapters/PnsAdapter/OkapiAdapter/OkapiAdapterPort";
import { PnsAdapterPort } from "../domain/port/PnsAdapterPort";
import { SessionInfoDto } from "../types/types";
import { INotificationService } from "./INotificationService";

export class NotificationService implements INotificationService {

    // Change OkapiAdapterPort by TokenServicePort responsible if retrieving tokens
    constructor(private pnsAdapterPort:PnsAdapterPort, private readonly okapiAdapter: OkapiAdapterPort
    ){}

    async notifyUnread(sessionInfoDto: SessionInfoDto, userId: string, unreadSms: number): Promise<void> {
        const token = await this.okapiAdapter.getTokenFromOkapi()
        return await this.pnsAdapterPort.notify(sessionInfoDto,userId,unreadSms,token)
    }
}