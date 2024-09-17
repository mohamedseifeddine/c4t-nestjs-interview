import {TechnicalError} from "../../../httpCall/TechnicalError";
import {DailyQuotaStoragePort} from "../../../quota/DailyQuotaStoragePort";
import {MonthlyQuotaStoragePort} from "../../../quota/MonthlyQuotaStoragePort";
import {QuotaService} from "../../../quota/QuotaService";
import {ReplySessionsStoragePort} from "../../../replySession/ReplySessionsStoragePort";
import {User} from "../../../User/User";
import {UserService} from "../../../User/UserService";
import {UserStoragePort} from "../../../User/UserStoragePort";
import {ShortCodeConfig} from "../../adapters/ShortCodeConfigBuilder";
import {DuplicateRecipientsError} from "../../Errors/DuplicateRecipientsError";
import {SendingMessage} from "../model/SendingMessage";
import {MessageFromApi} from "../model/MessageFromApi";
import {SendingMessageParser} from "../parser/SendingMessageParser";
import {BlackListedRecipientStoragePort} from "../port/BlackListedRecipientStoragePort";
import {MessageStoragePort} from "../port/MessageStoragePort";
import {MessagesToSendStoragePort} from "../port/MessagesToSendStoragePort";
import {PaddockAdapterPort} from "../port/PaddockAdapterPort";
import {MessageCapability} from "./MessageCapability";
import {ShortCodeService} from "./ShortCodeService";
import {LoggerAdapter} from "../../../logger/LoggerAdapter";


/*
await UserService.checkAvailableSpace(req, msgToSend.user, filteredMsgList.length * msgToSend.size);
return true si isPro
pas besoin






// quelque part : envoi de mail


// a traier lors de l'ack si on arrive à le reproduire / l'utiliser
// gestion du error code : errorCode.startsWith('xms_broker')
// le erreur code xms_broker est déclenché dans le acknowledge du message controller dans l'ancien code.



//faire un enum pour :
    message.status
    message.errorCode


/////////// Master account studies /////////

Master account = compte primaire

white liste sur le master account

//  onother locked code to studie
 // current user is a master account of a mobile user, new to WebXMS,
            // so we need to add the "first connection" lock
            if (user.getUserType() !== 'I' && user.isMasterAccount()) {
                user.lockCodeList.push({
                    code: conf.security.lockCodes.firstLogin.code,
                    reason: 'Création de l\'utilisateur',
                    date: new Date()
                });
            }

// If we got an lock code code error, lock the master account
            if (err instanceof LockedAccountError && err.details.lockCode) {
                req.masterAccount.lockCodeList.push({
                    code: err.details.lockCode,
                    reason: `Défini automatiquement par le système anti fraude à cause du compte ${user.wassup.ulo || user.wassup.msisdn}`,
                    date: new Date()
                });

// usage master account out side this path
masterAccount.getLastLockCode();

///////////////////////////////////

//////// LOG Studies ///////

logMetadata semble utilisé dans le /users/<userId> (appelé par oBetaProXMS)  et me (appelé par OMI)
post messsage
/api/v8/users/me/messages  pour oBetaProXMS.... il utilise le token pour le POST et l'id pour le GET

middleware log incoming
log response info
// selon les requetes : get users  ou post message

 req.logMetadata.dailyQuota = userData.dailyQuota;
        req.logMetadata.monthlyQuota = userData.monthlyQuota;
        req.logMetadata.pinLocked = userData.pinLocked;
        req.logMetadata.lockCode = userData.lockCode;  // status du lock UNLOCK ...

Tous les champs dans les logs avec logMetaData sont affiché dans un seul log par requete : Responded to request


req.logMetadata.recipientLength = body.recipients.length;
req.logMetadata.msgNumber = msgToSend.messagesNumber;
req.logMetadata.msgSize = msgToSend.size;
req.logMetadata.deferred = msgToSend.deferred;


 // compute some KPI that will be logged into the request response log
data.dailyQuota.*
data.monthlyQuota. *
req.logMetadata.xmsStatus = {
    error: 0,
    deferred: 0,
    sending: 0,
    sent: 0
};
if (msg.errorCode) {
    req.logMetadata.xmsStatus.error++;
}

if (msg.status === 'deferred') {
    req.logMetadata.xmsStatus.deferred++;
} else if (msg.status === 'sending') {
    req.logMetadata.xmsStatus.sending++;
} else if (msg.status === 'sent') {
    req.logMetadata.xmsStatus.sent++;
}


req.log.request = function request(data) {
    this.debug('Incoming request', {
        log_type: 'api_req',
        authorization: data.authorization,
        referer: data.referer,
        userAgent: data.userAgent
    });
};

req.log.response = function response(data) {
    this.info('Responded to request', {
        ...data,
        log_type: 'api_resp'
    });
};

// le bazare qui ecris les log a l'entré et à la sortie est dans le init.js du mdcs-validator qui est dans le mdcs-corelib
// bref, on regarde les log en prod et on fait presque pareil :)

req.log.error('Unable to deposit XMS as mail on user mailbox. Add it in the retry stack', {
    error: UtilsService.formatErrorForLog(err)
});

 */

export class MessagesService {
    private logger = new LoggerAdapter(MessagesService);
    private userService: UserService;
    private messageCapability: MessageCapability;
    private quotaService: QuotaService;
    private shortCodeService: ShortCodeService
 



    constructor(
        private messageStorage: MessageStoragePort,
        private messageToSendStorage: MessagesToSendStoragePort,
        private paddockAdapter: PaddockAdapterPort,
        private blackListeRecepientAdapter: BlackListedRecipientStoragePort,
        private userStorage: UserStoragePort,
        private monthlyQuotaStorage: MonthlyQuotaStoragePort,
        private dailyQuotaStorage: DailyQuotaStoragePort,
        private shortCodeConfig: ShortCodeConfig,
        private replySessionsStorage: ReplySessionsStoragePort
    ) {
        this.quotaService = new QuotaService(dailyQuotaStorage, monthlyQuotaStorage, userStorage);
        this.userService = new UserService(userStorage, this.quotaService)
        this.messageCapability = new MessageCapability(userStorage, this.quotaService);
        this.shortCodeService = new ShortCodeService(this.shortCodeConfig, replySessionsStorage)
      
    }

    async sendSms(messageToSend: MessageFromApi, replyable: boolean, uid: string) {
        const user = await this.userStorage.userByIse(uid);
        // gérer erreur
        this.checkUnicityPhoneNumber(messageToSend.destinationPhoneNumbers)
        const messages = SendingMessageParser.toMessageToSend(messageToSend)
        await this.checkSendingCapability(messages, user);

        await Promise.all(messages.map(async (message) => {
            const destinationPhoneNumber = message.recipient
            const messageStored = await this.messageStorage.storeMessage(message, user.id)
            const isBlackListed = await this.blackListeRecepientAdapter.isBlackListed(destinationPhoneNumber, user.id)
            if (isBlackListed) {
                message.errorCode = "BLACKLISTED_RECIPIENT"
                await this.messageStorage.updateSendingMessageOnFailure(user.id, messageStored.id, message.errorCode)
                await this.messageToSendStorage.saveMessageToRetry(message, messageStored.id)
            } else if (message.deferred) {
                this.logger.info(`message is deferred ${message}`)
                await this.messageToSendStorage.saveMessageToSend(message, messageStored.id)
            } else {
                try {
                    // everything is OK, reset error code if there was one
                    //message.errorCode = null;
                    const shortCode = await this.shortCodeService.findAvailableShortCode(destinationPhoneNumber, replyable, messageStored)
                    const hubMessageId = await this.paddockAdapter.sendSMS(shortCode, messageToSend.content, destinationPhoneNumber)
                    this.logger.info(`hubMessageId after send sms with paddock :  ${hubMessageId}`)
                    await this.messageStorage.updateSendingMessageOnSuccess(user.id, messageStored.id, hubMessageId)
                    await this.quotaService.incrementSentSmsForUser(user, message.messagesNumber, destinationPhoneNumber)
                    
            
                    // GESTION ERREUR D'ENVOI
                } catch (err: any) {
                    this.logger.error('an error : %s', err)
                    message.errorCode = err.name || new TechnicalError().message
                    await this.messageStorage.updateSendingMessageOnFailure(user.id, messageStored.id, message.errorCode)
                    await this.messageToSendStorage.saveMessageToRetry(message, messageStored.id)
                }
            }
        }))
        // gérer l'etat du message : todo, sent, sending, pending, recieved (voir l'ancien code)

        return messages
    }

    private async checkSendingCapability(messages: SendingMessage[], user: User) {
        const recipientList = messages.map(message => message.recipient)
        const msgNumber = messages.reduce((sum, msg) => sum + msg.messagesNumber, 0)
        await this.messageCapability.checkCapabality(user, msgNumber, recipientList)
    }

    private checkUnicityPhoneNumber(destinationPhoneNumbers: Array<string>) {
        const recipientSet = new Set(destinationPhoneNumbers);
        if (recipientSet.size < destinationPhoneNumbers.length) {
            throw new DuplicateRecipientsError();
        }
    }

    async deleteMessageById(messageId: string, uid: string): Promise<void> {
        const userId = (await this.userStorage.userByIse(uid)).id;
        await this.messageStorage.flagAsDeleted(messageId, userId)
        await this.userService.updateLastActivityDateToNowByUserId(uid)
    }
}
