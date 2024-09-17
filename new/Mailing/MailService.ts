import * as nodemailer from 'nodemailer';
import { MessageStoragePort } from '../message/domain/port/MessageStoragePort';
import { UserStoragePort } from '../User/UserStoragePort';
import { PhoneNumberService } from '../message/domain/service/PhoneNumberService';
import { User } from '../User/User';
import { MessageStored } from '../message/domain/model/MessageStored';
import { NewMailAdapter } from './NewMailAdapter';

class MailService {
    private mailerTransport: nodemailer.Transporter;
    private newMailAdapter: NewMailAdapter;

    static in8XmsKoTemplate = `
<html>
    <header>
        <title>Internet Orange - SMS/MMS
            <no-reply@orange.com>
        </title>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <style>
            p {
                line-height: 14px;
                margin: 10px;
            }
            .orange {
                color : #f16e00;
            }
        </style>
    </header>

    <body bgcolor="#FFFFFF" leftmargin="0" marginheight="0" marginwidth="0" topmargin="0">
        <div align="left">
            <p>Bonjour,</p>
            <p>Le SMS/MMS que vous avez envoyé au <span class="orange">{{recipient}}</span> le <span class="orange">{{date}}</span> à <span class="orange">{{time}}</span> n'a pas pu être remis à son destinataire (n° de téléphone erroné ou mobile éteint).</p>
            <p>Nous vous invitons à vérifier le numéro de téléphone et à renvoyer ce message ultérieurement.</p>
            <p>Merci de votre confiance.</p>
            <p>Bien cordialement,</p>
            <p>Votre service clients Orange</p>
            <p>-------------------------------------------------------------------------------------------------</p>
            <p>Ce courriel est envoyé automatiquement. Nous vous remercions de ne pas y répondre, votre demande ne pourrait être traitée.</p>
        </div>
    </body>
</html>
`;
    static boxes = {
        inbox: 'SF_INBOX',
        outbox: 'SF_OUTBOX',
    };

    static deferredNatures = {
        sms: 'OUTGOING-DEFERRED-SMS-NATURE',
    };

    static natures = {
        sms: {
            inbox: 'INCOMING-SMS-NATURE',
            outbox: 'OUTGOING-SMS-NATURE',
        },

    };


    static koNatures = {
        sms: 'INCOMING-FAILED-SMS-NATURE',
        mms: 'INCOMING-FAILED-MMS-NATURE',
    };

    constructor(private messageStorage: MessageStoragePort, private userStorage: UserStoragePort) {
        this.mailerTransport = nodemailer.createTransport({
            streamTransport: true,
            newline: 'windows',
            buffer: true
        });
        this.newMailAdapter = new NewMailAdapter();
    }

    getFromField(message: MessageStored, folder: 'inbox' | 'outbox', user: User): string {
        if (folder === 'outbox') {
            return `${user.ulo} <${user.ulo}>`;
        }
        const num = PhoneNumberService.getNormalizedNumber(message.recipient) || message.recipient;
        return `${num} <unknown@unknown.com>`;
    }

    getToField(message: MessageStored, folder: 'inbox' | 'outbox', user: User): string {
        if (folder === 'outbox') {
            return `${message.recipient} <unknown@unknown.com>`;
        }
        return `${user.ulo} <${user.ulo}>`;
    }
    getWumFromField(message: MessageStored, folder: 'inbox' | 'outbox', user: User): string {
        if (folder === 'outbox') {
            return `${user.ulo} <${user.ulo}>`;
        }

        const number = PhoneNumberService.getNormalizedNumber(message.recipient) || message.recipient;
        return `${number} <${number}>`;
    }

    getWumToField(message: MessageStored, folder: 'inbox' | 'outbox', user: User): string {
        if (folder === 'outbox') {
            return `${message.recipient} <${message.recipient}>`
        }

        return `${user.ulo} <${user.ulo}>`;
    }

    async depositXMSOK(hubMessageId: string, userId: string, folder: 'inbox' | 'outbox'): Promise<void> {
        const options = folder == 'outbox' ? { readflag: 'seen' } : null;
        const message = await this.messageStorage.messageByHubMessageId(hubMessageId)
        const user = await this.userStorage.userById(userId)
        const sender = this.getFromField(message, folder, user);
        const recipients = this.getToField(message, folder, user);
        const wumFrom = this.getWumFromField(message, folder, user);
        const wumTo = this.getWumToField(message, folder, user);
        let nature = MailService.natures['sms'][folder];
        let date = new Date();
        let deffered = new Date(message.deferredDate)

        if (message.deferred) {
            nature = MailService.deferredNatures['sms'];

            if (message.sendingDate && message.sendingDate > deffered) {
                date = message.sendingDate;
            } else if (message.deferredDate) {
                date = new Date(message.deferredDate);
            }
        }

        const mail = {
            messageId: message.id,
            date,
            subject: "SMS Orange",//I18nService.getText('IN8_SMS_SUBJECT'),
            headers: {
                'X-Wum-Nature': nature,
                'X-WUM-FROM': wumFrom,
                'X-WUM-TO': wumTo,
                'X-WUM-SENT-STATUS': 'OK',
            },
            text: message.content,
        };

        const info = await this.mailerTransport.sendMail(mail);

        const content = `From: ${sender}\r\nReply-To: ${sender}\r\nTo: ${recipients}\r\n${info.message.toString()}`;

        await this.newMailAdapter.depositMessage(user, content, options);
    }

    async depositXMSKO(hubMessageId: string, userId: string): Promise<void> {
        const folder = 'inbox';
        const sender = `Internet Orange - SMS <noreply@orange.com>`;
        const message = await this.messageStorage.messageByHubMessageId(hubMessageId)
        const user = await this.userStorage.userById(userId)
        const recipients = this.getToField(message, folder, user);
        const nature = message.deferred
            ? MailService.deferredNatures['sms']
            : MailService.koNatures['sms'];
        const date = message.sendingDate;


        const day = String(date!.getDate()).padStart(2, '0');
        const month = String(date!.getMonth() + 1).padStart(2, '0');
        const year = String(date!.getFullYear()).slice(-2);
        const formattedDate = `${day}/${month}/${year}`;

        const hours = String(date!.getHours()).padStart(2, '0');
        const minutes = String(date!.getMinutes()).padStart(2, '0');
        const formattedTime = `${hours}:${minutes}`;

        const template = MailService.in8XmsKoTemplate.slice();
        const html = template
            .replace('{{recipient}}', message.recipient)
            .replace('{{date}}', formattedDate)
            .replace('{{time}}', formattedTime);

        const mail = {
            messageId: message.id,
            subject: "Internet Orange - SMS/MMS",// I18nService.getText('IN8_KO_SUBJECT'),
            headers: {
                'X-Wum-Nature': nature,
            },
            html,
        };

        const info = await this.mailerTransport.sendMail(mail);

        const content = `From: ${sender}\r\nReply-To: ${sender}\r\nTo: ${recipients}\r\n${info.message.toString()}`;

        await this.newMailAdapter.depositMessage(user, content);
    }
}

export { MailService };
