import { ShortCode } from "../model/ShortCode";

export interface PaddockAdapterPort {
    sendSMS(shortcode: ShortCode, messageContent: string, destinationPhoneNumber: string): Promise<string>;
}
