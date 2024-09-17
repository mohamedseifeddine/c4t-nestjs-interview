import { ReplySessionStorageInMemory } from "../../../replySession/storageAdapter/ReplySessionStorageInMemory";
import { ShortCodeConfig } from "../../adapters/ShortCodeConfigBuilder";
import { NoReplySessionLeftError } from "../../Errors/NoReplySessionLeftError";
import { MessageStoredBuilder } from "../model/MessageStoredBuilder";
import { ShortCodeInternational } from "../model/ShortCodeInternational";
import { ShortCodeNoReply } from "../model/ShortCodeNoReply";
import { ShortCodeReplyable } from "../model/ShortCodeReplyable";
import { ShortCodeService } from "./ShortCodeService";

describe('ShortCodeService', () => {
    const shortCodeConfig = new ShortCodeConfig(
        new ShortCodeNoReply("aNoReplySenderadress", ["10000"], "noReplyOdiAuthorization"),
        new ShortCodeInternational("aInterSenderadress", ["20000"], "interOdiAuthorization"),
        [
            new ShortCodeReplyable("aReplyableSenderadress0", ["30000"], "ReplyableOdiAuthorization0"),
            new ShortCodeReplyable("aReplyableSenderadress1", ["30001"], "ReplyableOdiAuthorization1"),
        ]
    )
    let replySessionsStorage: ReplySessionStorageInMemory
    let shortCodeService: ShortCodeService
    let messageStoredBuilder: MessageStoredBuilder;

    beforeEach(() => {
        replySessionsStorage = new ReplySessionStorageInMemory()
        shortCodeService = new ShortCodeService(shortCodeConfig, replySessionsStorage);
        messageStoredBuilder = new MessageStoredBuilder()
    });

    test('find internationnal ShortCode', async () => {
        let message = messageStoredBuilder.build()
        const replyable = true;
        const destinationPhoneNumber = '+22123456789';

        const shortCode = await shortCodeService.findAvailableShortCode(destinationPhoneNumber, replyable, message)

        expect(shortCode).toEqual(shortCodeConfig.shortCodeInternational)
    })

    test('find noReply ShortCode', async () => {
        let message = messageStoredBuilder.build()
        const replyable = false;
        const destinationPhoneNumber = '+33123456789';

        const shortCode = await shortCodeService.findAvailableShortCode(destinationPhoneNumber, replyable, message)

        expect(shortCode).toEqual(shortCodeConfig.shortCodeNoReply)
    })

    test('find a replyable ShortCode use the first one when no reply session are started', async () => {
        const destinationPhoneNumber = '+33123456789';
        let message = messageStoredBuilder.withDestinationPhoneNumber(destinationPhoneNumber).build()

        const shortCode = await shortCodeService.findAvailableShortCode(destinationPhoneNumber, true, message)

        expect(shortCode).toEqual(shortCodeConfig.shortCodesReplyables[0])
    })

    test('when find shortCode, this one is in replySession storage', async () => {
        const destinationPhoneNumber = '+33123456789';
        let message = messageStoredBuilder.withDestinationPhoneNumber(destinationPhoneNumber).build()

        const shortCode = await shortCodeService.findAvailableShortCode(destinationPhoneNumber, true, message)

        const response = await replySessionsStorage.replySessions(shortCode.senderAddress, destinationPhoneNumber)
        expect(response.virtualShortCodeId).toEqual(shortCodeConfig.shortCodesReplyables[0].senderAddress)
    })

    test('find a second shortcode when the first is already use for the recipient', async () => {
        const destinationPhoneNumber = '+33123456789';
        let message = messageStoredBuilder.withDestinationPhoneNumber(destinationPhoneNumber).build()
        await replySessionsStorage.createReplySessions(shortCodeConfig.shortCodesReplyables[0].senderAddress, message)

        const shortCode = await shortCodeService.findAvailableShortCode(destinationPhoneNumber, true, message)

        expect(shortCode.senderAddress).toEqual(shortCodeConfig.shortCodesReplyables[1].senderAddress)
    })

    test('throw an error when there is no shortcode available for the recipient', async () => {
        const destinationPhoneNumber = '+33123456789';
        let message = messageStoredBuilder.withDestinationPhoneNumber(destinationPhoneNumber).build()
        await replySessionsStorage.createReplySessions(shortCodeConfig.shortCodesReplyables[0].senderAddress, message)
        await replySessionsStorage.createReplySessions(shortCodeConfig.shortCodesReplyables[1].senderAddress, message)

        await expect(shortCodeService.findAvailableShortCode(destinationPhoneNumber, true, message)).rejects.toThrow(new NoReplySessionLeftError(message.recipient))
    })
})
