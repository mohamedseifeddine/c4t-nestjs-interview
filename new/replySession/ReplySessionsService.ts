import { ShortCodeConfig, ShortCodeConfigBuilder } from "../message/adapters/ShortCodeConfigBuilder";
import { MessageStored } from "../message/domain/model/MessageStored";
import { ReplySessionsStoragePort } from "./ReplySessionsStoragePort";

export class ReplySessionsService {
    private virtualShortCodeList: any;

    constructor(private shortCodeConfig : ShortCodeConfig,private replySessionsStorage:ReplySessionsStoragePort) {

        this.virtualShortCodeList = ShortCodeConfigBuilder.loadShortCode()

    }

    async getVirtualShortCodeById(senderAddress: string) {
        return Object.values(this.shortCodeConfig).flat().find((vsc: any) => vsc.senderAddress === senderAddress);
  
    }

    async getVirtualShortCodeBySC(shortCode: string) {
        return Object.values(this.shortCodeConfig).flat().find((vsc: any) =>
            vsc.virtualShortCode.includes(shortCode)
        );
    }

    async createReplySessions(virtualShortCodeId:string,message:MessageStored){
        await this.replySessionsStorage.createReplySessions(virtualShortCodeId,message)
    }
    async replySessions(virtualShortCodeId:string,recepient:string){
        await this.replySessionsStorage.replySessions(virtualShortCodeId,recepient)
    }
}
