import {ShortCodeConfig} from "../../adapters/ShortCodeConfigBuilder";
import {ShortCodeNoReply} from "../model/ShortCodeNoReply";
import {ShortCodeInternational} from "../model/ShortCodeInternational";
import {ShortCodeReplyable} from "../model/ShortCodeReplyable";
import {ReplySessionStorageInMemory} from "../../../replySession/storageAdapter/ReplySessionStorageInMemory";
import {MessageStoredBuilder} from "../model/MessageStoredBuilder";
import {PaddockAdapterInMemory} from "../../adapters/PaddockAdapter/PaddockAdapterInMemory";
import {LoggerAdapter} from "../../../logger/LoggerAdapter";
import {LogsStreamInMemory} from "../../../logger/LogsStreamInMemory";
import {BlackListedRecipientStorageInMemory} from "../../adapters/storageAdapter/BlackListedRecipientStorageInMemory";
import {UserStorageInMemory} from "../../../User/storageAdapter/UserStorageInMemory";
import {SetUpUserForTest} from "../../../User/SetUpUserForTest";
import {BadFormatUdhValueError, XmsBrockerReplyService} from "./XmsBrockerReplyService";
import {MessageStorageInMemory} from "../../adapters/storageAdapter/MessageStorageInMemory";
import {MessageStoragePort} from "../port/MessageStoragePort";


describe('XmsBrockerReplyService', () => {
    const shortCodeConfig = new ShortCodeConfig(
        new ShortCodeNoReply("aNoReplySenderadress", ["10000"], "noReplyOdiAuthorization"),
        new ShortCodeInternational("aInterSenderadress", ["20000"], "interOdiAuthorization"),
        [
            new ShortCodeReplyable("aReplyableSenderadress0", ["30000", "3200"], "ReplyableOdiAuthorization0000000000000000000000000"),
            new ShortCodeReplyable("aReplyableSenderadress1", ["30001", "3201"], "ReplyableOdiAuthorization1"),
        ]
    )
    const shortCodeReplyable = shortCodeConfig.shortCodesReplyables[0];
    const receivedShortCode = shortCodeReplyable.virtualShortCode[1]
    const phoneNumber = '+33123456789';

    let logStream: LogsStreamInMemory;
    let messageStoredBuilder: MessageStoredBuilder;
    let replySessionStorage: ReplySessionStorageInMemory;
    let blackListedRecipientStorage: BlackListedRecipientStorageInMemory;
    let userStorage: UserStorageInMemory;
    let messageStorage: MessageStoragePort;
    let paddockAdapter: PaddockAdapterInMemory;
    let xmsBrockerReplyService: XmsBrockerReplyService

    beforeEach(() => {
        logStream = new LogsStreamInMemory();
        LoggerAdapter.logStream = logStream;
        replySessionStorage = new ReplySessionStorageInMemory();
        paddockAdapter = new PaddockAdapterInMemory()
        blackListedRecipientStorage = new BlackListedRecipientStorageInMemory();
        userStorage = new UserStorageInMemory();
        messageStorage = new MessageStorageInMemory();
        xmsBrockerReplyService = new XmsBrockerReplyService(shortCodeConfig, paddockAdapter, replySessionStorage, blackListedRecipientStorage, userStorage, messageStorage)
        messageStoredBuilder = new MessageStoredBuilder()
    })

    test('on reply, when shorcode is not find, log it', async () => {
        const shortCode = "1234";

        await xmsBrockerReplyService.reply(shortCode, phoneNumber, 'CONTACT', '', '')

        expect(logStream.logs[0].msg).toEqual(`shortCode unknow : ${shortCode}`)
    })

    test('on reply, when shorcode is not find, do not throw', async () => {
        const shortCode = "1234";

        const replyPromise = xmsBrockerReplyService.reply(shortCode, phoneNumber, 'CONTACT', '', '')

        await expect(replyPromise).resolves.not.toThrow()
    })

    test('on reply, when content is CONTACT, send sms to the sender with contact infos', async () => {
        const sendedShortCode = shortCodeReplyable.virtualShortCode[0];

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, ' CONTACT', '', '')

        expect(paddockAdapter.messagesSent[0].message).toEqual('Service SMS Orange : édité par Orange SA - RCS Paris 380 129 866 - 78 rue Olivier de Serres, 75505 Paris cedex 15')
        expect(paddockAdapter.messagesSent[0].shortcode).toEqual(sendedShortCode)
        expect(paddockAdapter.messagesSent[0].destinationPhoneNumber).toEqual(phoneNumber)
    })

    test('on reply, when content is AIDE, send sms to the sender with help infos', async () => {
        const sendedShortCode = shortCodeReplyable.virtualShortCode[0];

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'AIDE ', '', '')

        expect(paddockAdapter.messagesSent[0].message).toEqual('Service SMS Orange :\nObtenir des infos sur l\'éditeur d\'un message = répondez CONTACT\nBloquer l\'expéditeur = répondez STOP\nDébloquer l\'expéditeur = envoyez START + code reçu')
        expect(paddockAdapter.messagesSent[0].shortcode).toEqual(sendedShortCode)
        expect(paddockAdapter.messagesSent[0].destinationPhoneNumber).toEqual(phoneNumber)
    })

    test('on reply, when content is STOP, send sms to the sender', async () => {
        const sendedShortCode = shortCodeReplyable.virtualShortCode[0];
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build()
        await replySessionStorage.createReplySessions(shortCodeReplyable.senderAddress, message)

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'STOP', '', '')

        expect(paddockAdapter.messagesSent[0].message).toEqual(`Service SMS Orange : Vous ne recevrez plus aucun message de machin. Pour en recevoir à nouveau, répondez START ${user.id}\n(SMS non surtaxé)`)
        expect(paddockAdapter.messagesSent[0].shortcode).toEqual(sendedShortCode)
        expect(paddockAdapter.messagesSent[0].destinationPhoneNumber).toEqual(phoneNumber)
    })

    test('on reply, when content is STOP, the phoneNumber is black listed for the user', async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build()
        await replySessionStorage.createReplySessions(shortCodeReplyable.senderAddress, message)

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'STOP', '', '')

        expect(await (blackListedRecipientStorage.isBlackListed(phoneNumber, message.user))).toEqual(true)
    })

    test('on reply, when content is STOP and no reply session matched, send sms explain that we can not STOP sms now from the expeditor', async () => {

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'STOP ', '', '')

        expect(paddockAdapter.messagesSent[0].message).toEqual(`Service SMS Orange : Nous n'avons pas retrouvé l'expediteur initial. Après la réception d'un sms non désiré, vous avez 7 jours pour répondre STOP`)
    })

    test(`on reply, when content is STOP and it's ok, log it`, async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build()
        await replySessionStorage.createReplySessions(shortCodeReplyable.senderAddress, message)

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'STOP', '', '')

        expect(logStream.logs[0].msg).toEqual(`the user '${user.id}' is now blacklisted for the number : ${phoneNumber} `)
    })

    test(`on reply, when content is STOP and no session was found, log it`, async () => {

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'STOP', '', '')

        expect(logStream.logs[0].msg).toEqual(`no session find for the received short code : 'aReplyableSenderadress0' and the number : ${phoneNumber} `)
    })

    test('on reply, when content is START, send sms to the sender', async () => {
        const sendedShortCode = shortCodeReplyable.virtualShortCode[0];
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build()
        await replySessionStorage.createReplySessions(shortCodeReplyable.senderAddress, message)

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'START', '', '')

        expect(paddockAdapter.messagesSent[0].message).toEqual(`Service SMS Orange : Vous pouvez à nouveau recevoir des messages de machin. Pour ne plus en recevoir, répondez STOP\n(SMS non surtaxé)`)
        expect(paddockAdapter.messagesSent[0].shortcode).toEqual(sendedShortCode)
        expect(paddockAdapter.messagesSent[0].destinationPhoneNumber).toEqual(phoneNumber)
    })

    test("on reply, when content is START, remove the phoneNumber from the user's blacklist", async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build()
        await replySessionStorage.createReplySessions(shortCodeReplyable.senderAddress, message)
        await blackListedRecipientStorage.addBlaklistedRecipientForUser(phoneNumber,user.id)

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'START', '', '')

        expect(await (blackListedRecipientStorage.isBlackListed(phoneNumber, message.user))).toEqual(false)
    })

    test("on reply, when content is START and it's ok, log it", async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build()
        await replySessionStorage.createReplySessions(shortCodeReplyable.senderAddress, message)
        await blackListedRecipientStorage.addBlaklistedRecipientForUser(phoneNumber,user.id)

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'START', '', '')

        expect(logStream.logs[0].msg).toEqual(`the user '${user.id}' is now allow for the number : ${phoneNumber} `)
    })

    test(`on reply after 7 days, when content is START fallowing by a userId, remove the phoneNumber from the corresponding user's blacklist`, async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        await blackListedRecipientStorage.addBlaklistedRecipientForUser(phoneNumber,user.id)

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, `START ${user.id}`, '', '')

        expect(await (blackListedRecipientStorage.isBlackListed(phoneNumber, user.id))).toEqual(false)
    })

    test(`on reply after 7 days, when content is START fallowing by a userId, confirm by sms to the sender`, async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        await blackListedRecipientStorage.addBlaklistedRecipientForUser(phoneNumber,user.id)

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, `START ${user.id}`, '', '')

        expect(paddockAdapter.messagesSent[0].message).toEqual(`Service SMS Orange : Vous pouvez à nouveau recevoir des messages de machin. Pour ne plus en recevoir, répondez STOP\n(SMS non surtaxé)`)
    })

    test('on reply, when content is START and no reply session matched, send SMS explaining that the user should use the number received inside the STOP message', async () => {

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'START', '', '')

        expect(paddockAdapter.messagesSent[0].message).toEqual(`Service SMS Orange : Après 7 jours, pour recevoir de nouveau des messages de cet expediteur, vous devez précisez le numéro indiqué dans le sms reçus après votre envoi de STOP.`)
    })

    test('on reply, when content is START and no reply session matched, log it', async () => {

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'START', '', '')

        expect(logStream.logs[0].msg).toEqual(`no session find for the received short code : 'aReplyableSenderadress0' and the number : ${phoneNumber} `)
    })

    test(`on reply, when content is START and the user and phone number are not in the blacklist, send a sms explain that it's ok `, async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, `START ${user.id}`, '', '')

        expect(paddockAdapter.messagesSent[0].message).toEqual(`Service SMS Orange : Vous pouvez à nouveau recevoir des messages de machin. Pour ne plus en recevoir, répondez STOP\n(SMS non surtaxé)`)
    })

    test(`on reply, when content is START and the fallowing userId doesn't, send SMS explaining where find the number `, async () => {

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'START 1223345', '', '')

        expect(paddockAdapter.messagesSent[0].message).toEqual(`Service SMS Orange : Nous n'avons pas trouvé d'expéditeur correspondant au numéro que vous avez envoyé après START. Utilisé le numéro indiqué dans le sms reçus après votre envoi de STOP`)
    })

    test(`on reply, when it's a single sms, store it`, async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build()
        await replySessionStorage.createReplySessions(shortCodeReplyable.senderAddress, message)
        const timeCreated = "2020-03-19 16:32:59";

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'a simple answer', timeCreated, '')

        const retreivedMessage = (await messageStorage.messages(user.id))[0];
        expect(retreivedMessage!.content).toEqual('a simple answer');
        expect(retreivedMessage!.box).toEqual('inbox');
        expect(retreivedMessage!.size).toEqual(1);
        expect(retreivedMessage!.receivedPackets).toEqual(1);
        expect(retreivedMessage!.messagesNumber).toEqual(1);
        expect(retreivedMessage!.status).toEqual('received');
        expect(retreivedMessage!.read).toEqual(false);
        expect(retreivedMessage!.sendingDate).toEqual(new Date(timeCreated));
        /*
        vu dans l'ancien code mais obsolete :
        messageType: MessageModel.TYPE_SMS,
        billed: true,
        billingType: 'free',
         */
    })

    test(`on reply, when it's a multiple packet sms, store it as multiple packets`, async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build()
        await replySessionStorage.createReplySessions(shortCodeReplyable.senderAddress, message)
        const timeCreated = "2020-03-19 16:32:59";
        const textUDHValue = '050003AB0201'

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'a multiple packet sms answer', timeCreated, textUDHValue)

        const retreivedMessage = (await messageStorage.messages(user.id))[0];
        expect(retreivedMessage!.content).toEqual('');
        expect(retreivedMessage!.packets[0].content).toEqual('a multiple packet sms answer');
        expect(retreivedMessage!.packets[0].packetId).toEqual(1);
        expect(retreivedMessage!.packets[0].msgId).toEqual('83887019');
        expect(retreivedMessage!.hubMessageId).toEqual('MO-3200-6789-83887019');
        expect(retreivedMessage!.box).toEqual('inbox');
        expect(retreivedMessage!.size).toEqual(1);
        expect(retreivedMessage!.receivedPackets).toEqual(1);
        expect(retreivedMessage!.messagesNumber).toEqual(2);
        expect(retreivedMessage!.status).toEqual('receiving');
        expect(retreivedMessage!.read).toEqual(false);
        expect(retreivedMessage!.sendingDate).toEqual(new Date(timeCreated));
    })

    test(`on reply, when textUDHValue is miss format, throw dedicated error`, async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build()
        await replySessionStorage.createReplySessions(shortCodeReplyable.senderAddress, message)
        const timeCreated = "2020-03-19 16:32:59";
        const textUDHValue = '040003AB0201'

        const replyPromise = xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'a multiple packet sms answer', timeCreated, textUDHValue)

        await expect(replyPromise).rejects.toThrow(new BadFormatUdhValueError())
    })


    // WIP long sms as mms
    test.skip(`on reply, when it's a long sms received as mms, store it`, async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid')
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build()
        await replySessionStorage.createReplySessions(shortCodeReplyable.senderAddress, message)
        const timeCreated = "2020-03-19 16:32:59";

        await xmsBrockerReplyService.reply(receivedShortCode, phoneNumber, 'a simple answer', timeCreated, '', 'xml/boundary=truc')

        const retreivedMessage = (await messageStorage.messages(user.id))[0];
        expect(retreivedMessage!.content).toEqual('a simple answer');
        expect(retreivedMessage!.box).toEqual('inbox');
        expect(retreivedMessage!.status).toEqual('received');
        expect(retreivedMessage!.read).toEqual(false);
        expect(retreivedMessage!.sendingDate).toEqual(new Date(timeCreated));
        /*
        vu dans l'ancien code mais obsolete :
        messageType: MessageModel.TYPE_SMS,
        billed: true,
        billingType: 'free',
         */
    })



    /* TODO

    gérer sms long caché en mms

    gérer les notifs
    PNS
    MAil
     */




    /*
    cas d'un sms long convertie en mms en entrée. voir pour détcter et accepter ce cas
    if (!mms.attachments.length) {
            // This is a long SMS that has been converted into MMS by the client phone
            data.content = mms.content;
            data.messageType = 'sms';
     */
})
