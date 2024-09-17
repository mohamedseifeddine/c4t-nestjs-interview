import {ReceivingMessage} from "./ReceivingMessage";

export class MultiPacketsReceivedMessage extends ReceivingMessage {

    constructor(public readonly msgId: string,
                public readonly packetId: number,
                public readonly hubMessageId: string,
                public readonly recipient: string,
                public readonly content: string,
                public readonly sendingDate: Date,
                public readonly messagesNumber: number) {
        super(recipient, content, sendingDate)
    }

    /*
    message.user = replySessionUser;
    // For concatenated SMS, the message ID is not guaranteed unique. We have to try avoiding collision.
    // That's why we add some info about the sender and the recipient to add kind of namespace to the id
    // Once the XMS is fully received, remove the ID to avoid further collisions
    messageData.hubMessageId = `MO-${data.DA}-${data.SOA.substring(data.SOA.length - 4)}-${messageData.hubMessageId}`;

    box: 'inbox',
                status: 'receiving',
                read: false,
                billed: true,
                billingType: 'free',
                messagesNumber: messageData.messagesNumber,// == xmsSize ==> selon headers.textudhvalue[1] 5 ou 6 :
                recipient: messageData.sender, //== recipient comme pour ReceivingMessage
                content: '',
                sendingDate: messageData.sendingDate, //comme pour ReceivingMessage
                messageType: MessageModel.TYPE_SMS, //sms
                receivedPackets: 1,
                hubMessageId: messageData.hubMessageId,
                packets: [{
                    msgId: data.MsgId,
                    packetId: messageData.packetId,==> selon headers.textudhvalue[1] 5 ou 6
                    content: messageData.content
                }]
    message.size = //content.length;


encrypt decrypt packet content

     */


}
