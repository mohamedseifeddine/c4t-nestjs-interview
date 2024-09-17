import {SetUpUserForTest} from "../../../User/SetUpUserForTest";
import {UserStorageInMemory} from "../../../User/storageAdapter/UserStorageInMemory";
import {DateSimulator} from "../../../date-provider/DateSimulator";
import {QuotaService} from "../../../quota/QuotaService";
import {DailyQuotaStorageInMemory} from "../../../quota/storageAdapter/DailyQuotaStorageInMemory";
import {MonthlyQuotaStorageInMemory} from "../../../quota/storageAdapter/MonthlyQuotaStorageInMemory";
import {ReplySessionStorageInMemory} from "../../../replySession/storageAdapter/ReplySessionStorageInMemory";
import {DuplicateRecipientsError} from "../../Errors/DuplicateRecipientsError";
import {LockedAccountError} from "../../Errors/LockedAccountError";
import {MessageNotFoundError} from "../../Errors/MessageNotFoundError";
import {PaddockAdapterInMemory} from "../../adapters/PaddockAdapter/PaddockAdapterInMemory";
import {ShortCodeConfig} from "../../adapters/ShortCodeConfigBuilder";
import {BlackListedRecipientStorageInMemory} from "../../adapters/storageAdapter/BlackListedRecipientStorageInMemory";
import {MessageStorageInMemory} from "../../adapters/storageAdapter/MessageStorageInMemory";
import {MessagesToSendStorageInMemory} from "../../adapters/storageAdapter/MessagesToSendStorageInMemory";
import {SendingMessageBuilder} from "../model/SendingMessageBuilder";
import {MessageFromApiBuilder} from "../model/MessageFromApiBuilder";
import {ShortCodeInternational} from "../model/ShortCodeInternational";
import {ShortCodeNoReply} from "../model/ShortCodeNoReply";
import {ShortCodeReplyable} from "../model/ShortCodeReplyable";
import {MessagesService} from "./MessagesService";
import {ShortCodeService} from "./ShortCodeService";

describe('MessagesService', () => {
    const shortCodeConfig = new ShortCodeConfig(
        new ShortCodeNoReply("aNoReplySenderadress", ["10000"], "noReplyOdiAuthorization-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
        new ShortCodeInternational("aInterSenderadress", ["20000"], "interOdiAuthorization-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
        [
            new ShortCodeReplyable("aReplyableSenderadress0", ["30000"], "ReplyableOdiAuthorization0-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
        ]
    )
    let paddockAdapterInMemory: PaddockAdapterInMemory;
    let messageBuilder: MessageFromApiBuilder;
    let blackListedStorage: BlackListedRecipientStorageInMemory
    let userStorage: UserStorageInMemory;
    let messageStorage: MessageStorageInMemory
    let messageToSendStorage: MessagesToSendStorageInMemory;
    let replySessionsStorage: ReplySessionStorageInMemory
    let monthlyQuotaStorage: MonthlyQuotaStorageInMemory;
    let dailyQuotaStorage: DailyQuotaStorageInMemory;
    let messageService: MessagesService;
    let shortCodeService: ShortCodeService;
    let dateSimulator: DateSimulator;
    let quotaService: QuotaService;

    const uid = 'aUid'
    const puid = 'aPuid'
    const recipientNumber = "+33123456789"

    beforeEach(() => {
        dateSimulator = new DateSimulator();
        messageBuilder = new MessageFromApiBuilder()
        paddockAdapterInMemory = new PaddockAdapterInMemory();
        blackListedStorage = new BlackListedRecipientStorageInMemory()
        userStorage = new UserStorageInMemory();
        monthlyQuotaStorage = new MonthlyQuotaStorageInMemory();
        dailyQuotaStorage = new DailyQuotaStorageInMemory();
        messageStorage = new MessageStorageInMemory();
        messageToSendStorage = new MessagesToSendStorageInMemory();
        replySessionsStorage = new ReplySessionStorageInMemory()
        quotaService = new QuotaService(dailyQuotaStorage, monthlyQuotaStorage, userStorage);
        shortCodeService = new ShortCodeService(shortCodeConfig, replySessionsStorage)
        messageService = new MessagesService(messageStorage, messageToSendStorage, paddockAdapterInMemory, blackListedStorage, userStorage, monthlyQuotaStorage, dailyQuotaStorage, shortCodeConfig, replySessionsStorage);
    })

    afterEach(async () => {
        dateSimulator.restore()
    })

    // DESTINATION PHONE NUMBER TEST
    test('for two destination Phone Numbers, two sms are send', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)
        messageBuilder.withDestinationPhoneNumber("+33123456780")

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect(paddockAdapterInMemory.messagesSent.length).toEqual(2);
    })

    test('when destination phone number occur twice or more, then throw DuplicateRecipientsError', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        const promise = messageService.sendSms(messageBuilder.build(), true, uid);

        await expect(promise).rejects.toBeInstanceOf(DuplicateRecipientsError);
        expect(paddockAdapterInMemory.messagesSent.length).toEqual(0);
    })

    // BLACKLISTED TEST
    test('if a phone number is blacklisted, then the message has a BLACKLISTED_RECIPIENT error', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        await blackListedStorage.addBlaklistedRecipientForUser(recipientNumber, user.id)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        const msgTryingTosend = await messageService.sendSms(messageBuilder.build(), true, uid);

        expect(msgTryingTosend[0].errorCode).toEqual("BLACKLISTED_RECIPIENT")
    })

    test('if a phone number is blacklisted, then the message is not send', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        await blackListedStorage.addBlaklistedRecipientForUser(recipientNumber, user.id)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect(paddockAdapterInMemory.messagesSent.length).toEqual(0);
    })

    test('send sms with recepient not blacklisted then the return message has no error', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        const msgTryingTosend = await messageService.sendSms(messageBuilder.build(), true, uid);

        expect(msgTryingTosend[0].errorCode).toEqual('');
    })

    test('save message with errorCode when recepient is blacklisted', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        await blackListedStorage.addBlaklistedRecipientForUser(recipientNumber, user.id)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect((await messageStorage.messages(user.id))[0].errorCode).toEqual('BLACKLISTED_RECIPIENT');
    })

    test('save message with errorCode when recepient is blacklisted with status sending', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        await blackListedStorage.addBlaklistedRecipientForUser(recipientNumber, user.id)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect((await messageStorage.messages(user.id))[0].status).toEqual('sending');
    })

    test('this msg is saved in messageToSend table when recepient is blacklisted', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)
        await blackListedStorage.addBlaklistedRecipientForUser(recipientNumber, user.id)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        const messageStored = (await messageStorage.messages(user.id))[0];
        expect(((await messageToSendStorage.message(messageStored.id)).tries)).toEqual(1);
    })


    // DEFERRED TEST
    test("when sending deferred msg this msg is not sent", async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber).withDifferedDate('2024-06-10T10:55:01.000Z')

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect(paddockAdapterInMemory.messagesSent.length).toEqual(0);
    })

    test('when sending deferred msg this msg is saved in message table', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        const differedDate = '2024-06-10T10:55:01.000Z'
        messageBuilder.withDestinationPhoneNumber(recipientNumber).withDifferedDate(differedDate)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect((await messageStorage.messages(user.id))[0].recipient).toEqual(recipientNumber);
    })

    test('when sending deferred msg this msg is saved in message table with status to deferred', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        const differedDate = '2024-06-10T10:55:01.000Z'
        messageBuilder.withDestinationPhoneNumber(recipientNumber).withDifferedDate(differedDate)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect((await messageStorage.messages(user.id))[0].status).toEqual('deferred');
    })

    test('when sending deferred msg this msg is saved once in message table', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        const differedDate = '2024-06-10T10:55:01.000Z'
        messageBuilder.withDestinationPhoneNumber(recipientNumber).withDifferedDate(differedDate)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect((await messageStorage.messages(user.id)).length).toEqual(1);
    })

    test('when sending deferred msg this msg is saved in messageToSend table', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        const differedDate = '2024-06-10T10:55:01.000Z'
        messageBuilder.withDestinationPhoneNumber(recipientNumber).withDifferedDate(differedDate)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        const messageStored = (await messageStorage.messages(user.id))[0];
        expect(((await messageToSendStorage.message(messageStored.id)).requestedSendingDate)).toEqual(differedDate);
    })

    test('when sending deferred msg this msg is saved in messageToSend table with tries equal to 0', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        const differedDate = '2024-06-10T10:55:01.000Z'
        messageBuilder.withDestinationPhoneNumber(recipientNumber).withDifferedDate(differedDate)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        const messageStored = (await messageStorage.messages(user.id))[0];
        expect(((await messageToSendStorage.message(messageStored.id)).tries)).toEqual(0);
    })


    // SUCCESSFULLY SEND TEST
    test('save message when sending message', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect((await messageStorage.messages(user.id))[0].recipient).toEqual(recipientNumber);
    })

    test('save message once when successfully sent a message', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect((await messageStorage.messages(user.id)).length).toEqual(1);
    })

    test('save message with hubMessageId when successfully sent a message', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect((await messageStorage.messages(user.id))[0].hubMessageId).toEqual("aHubMessageId");
    })

    test('save message with status sent when successfully sent a message', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect((await messageStorage.messages(user.id))[0].status).toEqual("sent");
    })

    test('save message with actual sendingDate when successfully sent a message', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)
        const actualDate = '2024-05-24T00:00:00Z'
        dateSimulator.dateIs(actualDate)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect((await messageStorage.messages(user.id))[0].sendingDate).toEqual(new Date(actualDate));
    })


    // QUOTA TEST
    test("throw an error when the SMS content is too long and exceeds the quota", async () => {
        const smsWithLongContent = "Embrace the journey, for each step holds the potential for growth and discovery. Life’s beauty lies in its unpredictability, making every moment valuable and unique.Embrace the journey, for each step holds the potential for growth and discovery. Life’s beauty lies in its unpredictability, making every moment valuable and unique."
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)
        messageBuilder.withContent(smsWithLongContent)
        await quotaService.incrementSentSmsForUser(user, 248, '0656874395')

        const promiseMsgTryingTosend = messageService.sendSms(messageBuilder.build(), true, uid);

        await expect(promiseMsgTryingTosend).rejects.toThrow(LockedAccountError)
    })

    test("send an SMS with long content without exceeding the quota", async () => {
        const smsWithLongContent = "Embrace the journey, for each step holds the potential for growth and discovery. Life’s beauty lies in its unpredictability, making every moment valuable and unique.Embrace the journey, for each step holds the potential for growth and discovery. Life’s beauty lies in its unpredictability, making every moment valuable and unique."
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)
        messageBuilder.withContent(smsWithLongContent)
        await quotaService.incrementSentSmsForUser(user, 16, '0656874395')

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect(paddockAdapterInMemory.messagesSent[0].message).toEqual(smsWithLongContent);
    })

    test('send a small sms to one recipient increment by one the daily and monthly quota', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withContent('hello')
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        const quota = await quotaService.sentSms(user);
        expect(quota.daily).toEqual(1);
        expect(quota.monthly).toEqual(1);
    })

    test('send a small sms to two recipients increment by two the daily and monthly quota', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withContent('hello')
        messageBuilder.withDestinationPhoneNumber(recipientNumber)
        messageBuilder.withDestinationPhoneNumber("+33123456780")

        await messageService.sendSms(messageBuilder.build(), true, uid);

        const quota = await quotaService.sentSms(user);
        expect(quota.daily).toEqual(2);
        expect(quota.monthly).toEqual(2);
    })

    test("send an SMS with long content to one recipients increment by more than 1 the daily and monhtly quota", async () => {
        const smsWithLongContent = "Embrace the journey, for each step holds the potential for growth and discovery. Life’s beauty lies in its unpredictability, making every moment valuable and unique.Embrace the journey, for each step holds the potential for growth and discovery. Life’s beauty lies in its unpredictability, making every moment valuable and unique."
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)
        messageBuilder.withContent(smsWithLongContent)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        const quota = await quotaService.sentSms(user);
        expect(quota.daily).toEqual(3);
        expect(quota.monthly).toEqual(3);
    })

    test('not increment daily and monthly quota on send message, when recepient is blacklisted', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        await blackListedStorage.addBlaklistedRecipientForUser(recipientNumber, user.id)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        const quota = await quotaService.sentSms(user);
        expect(quota.daily).toEqual(0);
        expect(quota.monthly).toEqual(0);
    })


    // SHORTCODE TEST
    test('send sms on internationnal shortcode', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber('+22123456789')

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect(paddockAdapterInMemory.messagesSent[0].shortcode).toEqual(shortCodeConfig.shortCodeInternational.virtualShortCode[0]);
    })

    test('send sms on metropolitan replyable shortcode', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        await messageService.sendSms(messageBuilder.build(), true, uid);

        expect(paddockAdapterInMemory.messagesSent[0].shortcode).toEqual(shortCodeConfig.shortCodesReplyables[0].virtualShortCode[0]);
    })

    test('send sms with no reply', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)

        await messageService.sendSms(messageBuilder.build(), false, uid);

        expect(paddockAdapterInMemory.messagesSent[0].shortcode).toEqual(shortCodeConfig.shortCodeNoReply.virtualShortCode[0]);
    })

    test('return message with errorCode NO_REPLY_SESSION_LEFT on sending sms when all shortcode are already used for the recipient', async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)
        const messageToSend = messageBuilder.build();
        await messageService.sendSms(messageToSend, true, uid)

        const sendMessages = await messageService.sendSms(messageToSend, true, uid);

        expect(sendMessages[0].errorCode).toEqual('NO_REPLY_SESSION_LEFT')
    })

    test('store message with errorCode NO_REPLY_SESSION_LEFT on sending sms when all shortcode are already used for the recipient', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)
        const messageToSend = messageBuilder.build();
        await messageService.sendSms(messageToSend, true, uid)

        await messageService.sendSms(messageToSend, true, uid);

        expect((await messageStorage.messages(user.id))[1].errorCode).toEqual('NO_REPLY_SESSION_LEFT')
    })

    test('store message to retry stack on sending sms when all shortcode are already used for the recipient', async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        messageBuilder.withDestinationPhoneNumber(recipientNumber)
        const messageToSend = messageBuilder.build();
        await messageService.sendSms(messageToSend, true, uid)

        await messageService.sendSms(messageToSend, true, uid);

        expect((await messageToSendStorage.stakedMessagesToSend())[0].message).toEqual((await messageStorage.messages(user.id))[1].id)
    })

    // DELETE TEST
    test("delete the message successfully", async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        const unitaryMessage = new SendingMessageBuilder().build()
        const messageId = (await messageStorage.storeMessage(
            unitaryMessage,
            user.id
        )).id as string;

        const softDeleteMessageByIdPromise = messageService.deleteMessageById(messageId, uid)

        await expect(softDeleteMessageByIdPromise).resolves.not.toThrow()
    })

    test("update Last Activity Date To Now after deleting the message successfully", async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        const unitaryMessage = new SendingMessageBuilder().build()
        const messageId = (await messageStorage.storeMessage(
            unitaryMessage,
            user.id
        )).id as string;
        const lastActivityDate = '2024-05-24T00:00:00Z'
        dateSimulator.dateIs(lastActivityDate)

        await messageService.deleteMessageById(messageId, uid)

        expect((await userStorage.userByIse(uid)).lastActivityDate).toEqual(new Date(lastActivityDate))
    })

    test("throw MessageNotFoundError when message to delete is not found", async () => {
        await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        const messageId = "id_not_found"

        const softDeleteMessageByIdPromise = messageService.deleteMessageById(messageId, uid)

        await expect(softDeleteMessageByIdPromise).rejects.toThrow(new MessageNotFoundError())
    })

    test("throws message not found error when deleted an already deleted message", async () => {
        const user = await SetUpUserForTest.createUserAndPrimaryInStorage(userStorage, uid, puid)
        const expectedError = new MessageNotFoundError()
        const unitaryMessage = new SendingMessageBuilder().build()
        const messageId = (await messageStorage.storeMessage(
            unitaryMessage,
            user.id
        )).id;
        await messageService.deleteMessageById(messageId, uid)

        const deleteMessageByIdPromise = messageService.deleteMessageById(messageId, uid)

        await expect(deleteMessageByIdPromise).rejects.toThrow(expectedError)
    })
})
