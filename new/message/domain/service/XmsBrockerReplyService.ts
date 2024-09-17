import {LoggerAdapter} from "../../../logger/LoggerAdapter";
import {ShortCodeConfig} from "../../adapters/ShortCodeConfigBuilder";
import {PaddockAdapterPort} from "../port/PaddockAdapterPort";
import {ReplySessionsStoragePort} from "../../../replySession/ReplySessionsStoragePort";
import {BlackListedRecipientStoragePort} from "../port/BlackListedRecipientStoragePort";
import {UserStoragePort} from "../../../User/UserStoragePort";
import {
    ContactReplyCommand,
    HelpReplyCommand,
    StartReplyCommand,
    StartWithUserIdReplyCommand,
    StopReplyCommand
} from "./ReplyCommands";
import {MessageStoragePort} from "../port/MessageStoragePort";
import {ReceivingMessage} from "../model/ReceivingMessage";

import {MultiPacketsReceivedMessage} from "../model/MultiPacketsReceivedMessage";
import {DomainError} from "../../../Error/DomainError";
import { DOMParser, Node }  from '@xmldom/xmldom'
import xpath from 'xpath'


export class BadFormatUdhValueError extends DomainError {

    constructor() {
        super(BadFormatUdhValueError.name, "Invalid UDH header format")
    }
}


class MultiPacketsInfo {
    constructor(public readonly xmsId: string, public readonly xmsSize: number, public readonly packetId: number) {

    }

}

class Part {


    constructor(
        public readonly contentType: string,
        public readonly contentLocation: string,
        public readonly contentId: string,
        public readonly contentTransferEncoding: string,
        public readonly content: string,
    ) {
    }
}

class Attachment {
    constructor(
        public readonly contentType:string,
        public readonly name:string,
        public readonly encoding:string,
        public readonly file:string,
    ) {
    }
}

export class XmsBrockerReplyService {
    private logger = new LoggerAdapter(XmsBrockerReplyService)

    constructor(
        private shortCodeConfig: ShortCodeConfig,
        private paddockAdapter: PaddockAdapterPort,
        private replySessionStorage: ReplySessionsStoragePort,
        private blackListedRecipientStorage: BlackListedRecipientStoragePort,
        private userStorage: UserStoragePort,
        private messageStorage: MessageStoragePort) {

    }

    async reply(shortCode: string, phoneNumber: string, content: string, timeCreated: string, textUDHValue: string, mmsContentType?: string) {
        const shortCodeReplyable = this.findShorCode(shortCode)
        if (shortCodeReplyable === undefined) {
            this.logger.debug(`shortCode unknow : ${shortCode}`)
            return
        }

        if (mmsContentType) {
            content = this.extractSmsContentFromMms(content, mmsContentType);
            // check if it's a long sms
            // if it's, update content consequently
        }

        const command = this.parseToReplyCommand(content)
        if (command !== undefined) {
            await command.doAction(shortCodeReplyable, phoneNumber)
            return
        }

        const replySession = await this.replySessionStorage.replySessions(shortCodeReplyable.senderAddress, phoneNumber)
        // TODO LOG
        if (textUDHValue !== '') { // = Long Sms
            const receivingPacketInfo = this.parseMultiPacketInfo(textUDHValue)
            // For concatenated SMS, the message ID is not guaranteed unique. We have to try avoiding collision.
            // That's why we add some info about the sender and the recipient to add kind of namespace to the id
            // Once the XMS is fully received, remove the ID to avoid further collisions
            const hubMessageId = `MO-${shortCode}-${phoneNumber.substring(phoneNumber.length - 4)}-${receivingPacketInfo.xmsId}`;

            const message = new MultiPacketsReceivedMessage(
                receivingPacketInfo.xmsId,
                receivingPacketInfo.packetId,
                hubMessageId,
                phoneNumber,
                content,
                new Date(timeCreated),
                receivingPacketInfo.xmsSize
            )
            // TODO LOG
            await this.messageStorage.storeMultiPacketsReceivedMessages(replySession.user, message)
        } else { //short sms - 1 packet
            const message = new ReceivingMessage(
                phoneNumber,
                content,
                new Date(timeCreated)
            )
            // TODO LOG
            await this.messageStorage.storeMessage(message, replySession.user)
        }
    }

    private findShorCode(shortCode: string) {
        return this.shortCodeConfig.shortCodesReplyables
            .find(
                shortCodeReplayable => shortCodeReplayable.virtualShortCode
                    .find(virtualShortCode => virtualShortCode === shortCode
                    )
            );
    }

    private parseToReplyCommand(content: string) {
        const contentTrim = content.trim();

        if (contentTrim === 'CONTACT') {
            return new ContactReplyCommand(this.paddockAdapter)
        }
        if (contentTrim === 'AIDE') {
            return new HelpReplyCommand(this.paddockAdapter)
        }
        if (contentTrim === 'STOP') {
            return new StopReplyCommand(this.paddockAdapter, this.replySessionStorage, this.blackListedRecipientStorage, this.userStorage)
        }
        if (contentTrim === 'START') {
            return new StartReplyCommand(this.paddockAdapter, this.replySessionStorage, this.blackListedRecipientStorage, this.userStorage)
        }
        if (contentTrim.startsWith('START')) {
            return new StartWithUserIdReplyCommand(this.paddockAdapter, this.replySessionStorage, this.blackListedRecipientStorage, this.userStorage, contentTrim)
        }
    }

    private parseMultiPacketInfo(textUDHValue: string) {
        switch (textUDHValue[1]) {
            case '5':
                return new MultiPacketsInfo(
                    String(parseInt(textUDHValue.substr(0, 8).toLowerCase(), 16)),
                    parseInt(textUDHValue.substr(8, 2), 16),
                    parseInt(textUDHValue.substr(10, 2), 16)
                )

            case '6':
                return new MultiPacketsInfo(
                    String(parseInt(textUDHValue.substr(0, 10).toLowerCase(), 16)),
                    parseInt(textUDHValue.substr(10, 2), 16),
                    parseInt(textUDHValue.substr(12, 2), 16)
                )

            default:
                throw new BadFormatUdhValueError();
        }
    }

    private extractSmsContentFromMms(content: string, mmsContentType: string) {
        // from old code base -- log and refacto when all case are understound
        // Parse the MMS content
        const mms = {
            content: '',
            attachments: new Array<Attachment>()
        };

        // Get the MMS blocks - Remove the first and the last one that are empty
        const partList: Array<Part> = [];
        const boundary = mmsContentType.match(/boundary="(.+?)"/)![1];
        const blocks = content.split(`--${boundary}`).slice(1, -1);

        blocks.forEach((block) => {
            const steps = block.replace(/\r/g, '').split(/\n{2}/);
            const headers = this.parseHeaders(steps[0]);
            const body = steps[1].trim();
            const contentType = headers.get('content-type').match(/^([^;]+?);/)[1];

            partList.push(new Part(
                contentType,
                headers.get('content-location'),
                headers.get('content-id'),
                headers.get('content-transfer-encoding'),
                body
            ));
        });

        let mmsContent = this.extractMmsContentFromSmil(partList);

        if (mmsContent === null) {
            mmsContent = this.extractMmsContentWithoutSmil(partList);
        }

        mms.content = mmsContent.content;
        mms.attachments = mmsContent.attachments;

        if (!mms.attachments.length) {
            // This is a long SMS that has been converted into MMS by the client phone
            return mms.content;
        }
        throw new Error(`MMS Error, it's a real mms, do something with it`)
    }


    /**
     * Extract the MMS content (body + attach) by reading the SMIL, from the part list
     * @param {Array<Object>} partList The part list received for the MMS
     * @returns {{attachments: [], content: string}|null} The MMS data (body + attachments)
     */
    private extractMmsContentFromSmil(partList: Array<Part>) {
        if (!partList || !partList.length) {
            return null;
        }

        const smilAttach = partList.find((attach) => attach.contentType === 'application/smil');

        if (!smilAttach) {
            return null;
        }

        const smil = this.partContentToUTF8String(smilAttach);

        // find every text tag and extract their src attribute
        // for each text src, find the matching attachment and build the MMS text body
        // Then, take non-text src from the SMIL, find the matching attachments, and ad them as MMS attachment
        const domParser = new DOMParser();

        const document = domParser.parseFromString(smil, 'text/xml');
        // @ts-ignore
        const nodeValues = xpath.select('//*[local-name(.)=\'text\']/@src', document) as Array;
        const textBodyAttachIdList = new Array<string>();
        const mmsData = {
            content: '',
            attachments: new Array<Attachment>
        };

        nodeValues.forEach((node:Node) => {
            textBodyAttachIdList.push(node.nodeValue!.trim().replace(/^cid:/i, ''));
        });

        for (const attach of partList) {
            if (textBodyAttachIdList.includes(attach.contentLocation)) {
                if (mmsData.content) {
                    mmsData.content += '\n';
                }

                mmsData.content += this.partContentToUTF8String(attach);
            } else if (attach.contentType !== 'application/smil') {
                mmsData.attachments.push(
                    new Attachment(
                        attach.contentType,
                    attach.contentLocation || attach.contentId,
                    attach.contentTransferEncoding,
                    attach.content
            ));
            }
        }

        return mmsData;
    }


    /**
     * Extract the MMS content (body + attach) by guessing what attachment is the text body, from the part list
     * @param {Array<Object>} partList The part list received for the MMS
     * @returns {{attachments: [], content: string}|null} The MMS data (body + attachments)
     */
    private extractMmsContentWithoutSmil(partList: Array<Part>) {
        const mmsData = {
            content: '',
            attachments: new Array<Attachment>()
        };

        if (partList && partList.length) {
            const userAttachList = partList.filter(
                (attach) => !((attach.contentType === 'application/smil' || attach.contentType === 'text/plain') &&
                    attach.contentId.match(/^<text[0-9]*>$/))
            );

            mmsData.attachments = userAttachList.map((attach) => (
                new Attachment(
                attach.contentType,
                attach.contentLocation || attach.contentId,
                attach.contentTransferEncoding,
                attach.content
        )));

            const textPartList = partList.filter(
                (attach) => attach.contentType === 'text/plain' && attach.contentId.match(/^<text[0-9]*>$/)
            );

            textPartList.forEach((textPart) => {
                if (mmsData.content) {
                    mmsData.content += '\n';
                }

                mmsData.content += this.partContentToUTF8String(textPart);
            });
        }

        return mmsData;
    }

    /**
     * Returns the part content as a human readable UTF8 string
     * @param {Object} part The MMS part
     * @returns {string} The part content as UTF8 string
     */
    private partContentToUTF8String(part: Part) {
        if (part.contentTransferEncoding === 'base64') {
            return Buffer.from(part.content, 'base64').toString('utf8');
        }

        return part.content.toString();
    }

    /**
     * This method takes a block of headers as entry (string) and extract each header to output an object
     * @param {string} headersBlock The headers block to parse
     * @returns {Object} The extracted headers
     */
    private parseHeaders(headersBlock: any) {
        const result = new Map();

        if (!headersBlock) {
            return result;
        }

        const headers = headersBlock.trim().split(/[\n\r]+/);

        headers.forEach((header: any) => {
            const match = header.trim().match(/^([^:]+?):(.+)$/);
            const name = match[1].trim().toLowerCase();

            result.set(name, match[2].trim())
        });

        return result;
    }

}
