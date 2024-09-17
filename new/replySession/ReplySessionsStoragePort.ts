import { MessageStored } from "../message/domain/model/MessageStored";
import { ReplySessionsStored } from "./ReplySessionsStored";

export abstract class ReplySessionsStoragePort {
    
    abstract createReplySessions(virtualShortCodeId:string,message:MessageStored): Promise<void>;
    abstract replySessions(virtualShortCodeId:string,recepient:string):Promise<ReplySessionsStored>;
   
}