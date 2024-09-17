import {PaddockAdapterPort} from "../port/PaddockAdapterPort";
import {ReplySessionsStoragePort} from "../../../replySession/ReplySessionsStoragePort";
import {BlackListedRecipientStoragePort} from "../port/BlackListedRecipientStoragePort";
import {UserStoragePort} from "../../../User/UserStoragePort";
import {ShortCodeReplyable} from "../model/ShortCodeReplyable";
import {ReplySessionsNotFoundInStorageError} from "../../../replySession/Errors/ReplySessionsNotFoundInStorageError";
import {ReplySessionsStored} from "../../../replySession/ReplySessionsStored";
import {User} from "../../../User/User";
import {UserNotFoundInStorageWithUserIdError} from "../../../User/Errors/UserNotFoundInStorageWithUserIdError";
import {ShortCode} from "../model/ShortCode";
import {LoggerAdapter} from "../../../logger/LoggerAdapter";
import {SessionInfo} from "../../../globalMiddlewares/SessionInfo";

abstract class ReplyCommand {
    constructor(private paddockAdapter: PaddockAdapterPort) {
    }

    abstract doAction(shortCodeReplyable: ShortCodeReplyable, phoneNumber: string): Promise<void>

    protected async sendSms(shortCodeReplyable: ShortCodeReplyable, phoneNumber: string, messageContent: string) {
        await this.paddockAdapter.sendSMS(
            shortCodeReplyable!,
            messageContent,
            phoneNumber
        )
    }
}

export class ContactReplyCommand extends ReplyCommand {
    async doAction(shortCodeReplyable: ShortCodeReplyable, phoneNumber: string): Promise<void> {
        await this.sendSms(shortCodeReplyable, phoneNumber, "Service SMS Orange : édité par Orange SA - RCS Paris 380 129 866 - 78 rue Olivier de Serres, 75505 Paris cedex 15");
    }

}

export class HelpReplyCommand extends ReplyCommand {
    async doAction(shortCodeReplyable: ShortCodeReplyable, phoneNumber: string): Promise<void> {
        await this.sendSms(shortCodeReplyable, phoneNumber, "Service SMS Orange :\nObtenir des infos sur l'éditeur d'un message = répondez CONTACT\nBloquer l'expéditeur = répondez STOP\nDébloquer l'expéditeur = envoyez START + code reçu");
    }

}

export class StopReplyCommand extends ReplyCommand {
    private logger = new LoggerAdapter(StopReplyCommand)

    constructor(paddockAdapter: PaddockAdapterPort,
                private replySessionStorage: ReplySessionsStoragePort,
                private blackListedRecipientStorage: BlackListedRecipientStoragePort,
                private userStorage: UserStoragePort) {
        super(paddockAdapter);
    }

    async doAction(shortCodeReplyable: ShortCodeReplyable, phoneNumber: string): Promise<void> {
        const replySessionsStored = await this.findReplySessionAndManageNotExisting(shortCodeReplyable, phoneNumber);
        if (replySessionsStored === undefined) {
            return
        }
        await this.blockUserAndSendBlackListSms(phoneNumber, replySessionsStored, shortCodeReplyable);
    }

    private async findReplySessionAndManageNotExisting(shortCodeReplyable: ShortCodeReplyable, phoneNumber: string) {
        try {
            return await this.replySessionStorage.replySessions(shortCodeReplyable.senderAddress, phoneNumber);
        } catch (e: any) {
            if (e instanceof ReplySessionsNotFoundInStorageError) {
                this.logger.debug(`no session find for the received short code : '${shortCodeReplyable.senderAddress}' and the number : ${phoneNumber} `);
                await this.sendSms(
                    shortCodeReplyable,
                    phoneNumber,
                    `Service SMS Orange : Nous n'avons pas retrouvé l'expediteur initial. Après la réception d'un sms non désiré, vous avez 7 jours pour répondre STOP`
                )
            } else {
                this.logger.error('uncatch error : ', e);
                throw e;
            }
        }
    }

    private async blockUserAndSendBlackListSms(phoneNumber: string, replySessionsStored: ReplySessionsStored, shortCodeReplyable: ShortCodeReplyable) {
        await this.blackListedRecipientStorage.addBlaklistedRecipientForUser(phoneNumber, replySessionsStored.user)
        const user = await this.userStorage.userById(replySessionsStored.user)
        this.logger.debug(`the user '${replySessionsStored.user}' is now blacklisted for the number : ${phoneNumber} `);

        const senderShortAlias = user.ulo.match(/^([^@]+)/)![1].slice(0, 10)
        await this.sendSms(
            shortCodeReplyable,
            phoneNumber,
            `Service SMS Orange : Vous ne recevrez plus aucun message de ${senderShortAlias}. Pour en recevoir à nouveau, répondez START ${user.id}\n(SMS non surtaxé)`
        )
    }
}

export class StartReplyCommand extends ReplyCommand {
    private logger = new LoggerAdapter(StartReplyCommand)

    constructor(paddockAdapter: PaddockAdapterPort,
                private replySessionStorage: ReplySessionsStoragePort,
                private blackListedRecipientStorage: BlackListedRecipientStoragePort,
                private userStorage: UserStoragePort) {
        super(paddockAdapter);
    }

    async doAction(shortCodeReplyable: ShortCodeReplyable, phoneNumber: string): Promise<void> {
        const replySessionsStored = await this.findReplySessionAndManageNotExisting(shortCodeReplyable, phoneNumber);
        if (replySessionsStored === undefined) {
            return
        }
        await this.reactivateUserAndSendSms(phoneNumber, replySessionsStored.user, shortCodeReplyable);
    }

    private async findReplySessionAndManageNotExisting(shortCodeReplyable: ShortCodeReplyable, phoneNumber: string) {
        try {
            return await this.replySessionStorage.replySessions(shortCodeReplyable.senderAddress, phoneNumber);
        } catch (e: any) {
            if (e instanceof ReplySessionsNotFoundInStorageError) {
                this.logger.debug(`no session find for the received short code : '${shortCodeReplyable.senderAddress}' and the number : ${phoneNumber} `);
                await this.sendSms(
                    shortCodeReplyable,
                    phoneNumber,
                    "Service SMS Orange : Après 7 jours, pour recevoir de nouveau des messages de cet expediteur, vous devez précisez le numéro indiqué dans le sms reçus après votre envoi de STOP."
                )
            } else {
                throw e;
            }
        }
    }

    protected async reactivateUserAndSendSms(phoneNumber: string, userId: string, shortCodeReplyable: ShortCodeReplyable) {
        await this.blackListedRecipientStorage.removeBlacklistedRecipientForUser(phoneNumber, userId)
        this.logger.debug(`the user '${userId}' is now allow for the number : ${phoneNumber} `)
        let user: User;
        try {
            user = await this.userStorage.userById(userId);
        } catch (e: any) {
            if (e instanceof UserNotFoundInStorageWithUserIdError) {
                await this.sendSmsUserNotFoundOnReactivate(shortCodeReplyable, phoneNumber)
                return;
            }
            throw e;
        }
        await this.sendSmsSuccededReactivate(user, shortCodeReplyable, phoneNumber);
    }

    private async sendSmsSuccededReactivate(user: User, shortCodeReplyable: ShortCodeReplyable, phoneNumber: string) {
        const senderShortAlias = user!.ulo.match(/^([^@]+)/)![1].slice(0, 10)
        await this.sendSms(
            shortCodeReplyable,
            phoneNumber,
            `Service SMS Orange : Vous pouvez à nouveau recevoir des messages de ${senderShortAlias}. Pour ne plus en recevoir, répondez STOP\n(SMS non surtaxé)`
        )
    }

    private async sendSmsUserNotFoundOnReactivate(shortcode: ShortCode, destinationPhoneNumber: string) {
        await this.sendSms(
            shortcode,
            destinationPhoneNumber,
            `Service SMS Orange : Nous n'avons pas trouvé d'expéditeur correspondant au numéro que vous avez envoyé après START. Utilisé le numéro indiqué dans le sms reçus après votre envoi de STOP`
        )
    }
}

export class StartWithUserIdReplyCommand extends StartReplyCommand {
    constructor(paddockAdapter: PaddockAdapterPort,
                replySessionStorage: ReplySessionsStoragePort,
                blackListedRecipientStorage: BlackListedRecipientStoragePort,
                userStorage: UserStoragePort,
                private content: string) {
        super(paddockAdapter, replySessionStorage, blackListedRecipientStorage, userStorage);
    }

    async doAction(shortCodeReplyable: ShortCodeReplyable, phoneNumber: string) {
        const userId = this.content.match(/^START( ([0-9a-f-]+))?$/)![2]
        await this.reactivateUserAndSendSms(phoneNumber, userId, shortCodeReplyable)
    }

}
