import { LoggerAdapter } from "../logger/LoggerAdapter";
import { SmtpError } from "./Errors/SmtpError";

const nodemailer = require('nodemailer');


class MailNotifService {
    private logger = new LoggerAdapter(MailNotifService)
    static template = `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <style>
                a {
                    color : #f16e00;
                }
                .orange_main_content p {
                    margin-bottom: 15px;
                }
    
                .main-content .signature {
                    color : rgb(90,90,90);
                }
            </style>
        </head>
        <body>
            <div style="font-family:Arial;text-align:center;">
                <div class="orange_main_content" width="700" style="display:block;margin-left:auto;margin-right:auto;margin-top:50px;text-align:left;width:700px;">
                    <img src="{{logoUrl}}" class="logo-orange" width="40" height="40" style="display:block;width:40px;height:40px" />
    
                    <div class="title" style="font-size:18pt;font-family:Helvetica;margin-top:40px;margin-bottom:50px;color:#f16e00;font-weight:normal;">{{title}}</div>
    
                    <p class="ref" style="font-family:Arial;font-size:7.5pt;color:rgb(153,153,153);margin-bottom:50px">ref : {{ref}}</p>
    
                    <div class="main-content" style="font-family:Arial;color:black;font-size:8.5pt;margin-bottom:20px;">{{content}}</div>
    
                    <p class="disclaimer" style="font-size:7.5pt;font-family:Helvetica;color:rgb(180,179,179);">{{disclaimer}}</p>
                </div>
            </div>
        </body>
    </html>
    `;
    
    async notify() {
        const html = MailNotifService.template.slice()
            .replace('{{logoUrl}}', 'https://c.orange.fr/logo-orange.png')
            .replace('{{disclaimer}}', "Orange, SA au capital de 10 640 226 396 € - 78 rue Olivier de Serres, 75505 Paris cedex 15 - RCS Paris 380 129 866<br />Merci de ne pas répondre à ce courrier électronique. Pour <a href=\"https://assistance.orange.fr/assistance-commerciale/les-modalites-pour-contacter-orange/contacter-orange_143796-154608\">nous contacter</a><br />Nous vous rappelons que Orange ne vous demandera jamais vos coordonnées bancaires par email, et vous invitons à nous signaler tout message suspect à l'adresse suivante <a href=\"mailto:abuse@orange.fr\">abuse@orange.fr</a><br />Les informations vous concernant sont traitées par Orange dans le cadre de l'exécution de votre contrat ainsi qu'à des fins d'analyses et de prospection commerciale. Conformément à la \"Loi Informatique et Libertés\" du 6 janvier 1978, vous disposez d'un droit d'accès, de rectification et d'opposition aux données personnelles vous concernant en écrivant à Orange Service Clients, Gestion des données personnelles, 33734 Bordeaux cedex 9 (indiquez vos nom, prénom, adresse, numéro de téléphone et joindre un justificatif d'identité).")
            .replace('{{title}}', "Notification de réception d'un SMS")
            .replace('{{ref}}', "654654")
            .replace('{{content}}',"<p>Bonjour,</p><p>Vous avez reçu un SMS. Pour le consulter, <a href=\"https://smsmms.orange.fr\">connectez-vous au service SMS/MMS</a>.</p><p class=\"signature\">Merci de votre confiance.<br />Le service client Orange</p>");

        const mail = {
            from: 'noreply.internet@orange.com',
            replyTo: 'noreply.internet@orange.com',
            to: 'seif123@yopmail.com',
            subject: "Notification de réception d'un SMS",
            html
        };

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 25,
            secure: false,
        });

       

        this.logger.debug('Call SMTP-mailer', {
            log_type: 'partner',
            partner_id: 'SMTP-mailer',
            partnerReq: {
                method: 'sendMail',
                url: process.env.SMTP_HOST
            }
        });

        const hrtime = process.hrtime();
        const responseTime =  hrtime[0] * 1000 + hrtime[1] / 1000000;

        try {
            const resp = await transporter.sendMail(mail);

            this.logger.info('SMTP-mailer response', {
                log_type: 'partner',
                partner_id: 'SMTP-mailer',
                partnerReq: {
                    method: 'sendMail',
                    url: process.env.SMTP_HOST,
                    status: 'OK',
                    mailerInfo: JSON.stringify({
                        messageId: resp.messageId,
                        accepted: resp.accepted,
                        rejected: resp.rejected,
                        pending: resp.pending
                    }),
                    response_time: responseTime
                }
            });
        } catch (err:any) {
            this.logger.error(`SMTP-mailer error ${err.message}`, {
                log_type: 'partner',
                partner_id: 'SMTP-mailer',
                partnerReq: {
                    method: 'sendMail',
                    url: process.env.SMTP_HOST,
                    status: 'KO',
                    response_time: responseTime
                }
            });

            throw new SmtpError('SMTP_ERROR',  err.status || 500);
        }
    }
}

export  {MailNotifService};
