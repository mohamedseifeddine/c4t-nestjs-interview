import express, {json, NextFunction, Request, Response, Router} from "express";
import {XmsBrockerAcknowledgementService} from "../domain/service/XmsBrockerAcknowledgementService";
import {LoggerAdapter} from "../../logger/LoggerAdapter";
import {BadFormatUdhValueError, XmsBrockerReplyService} from "../domain/service/XmsBrockerReplyService";

export class XmsBrockerRouter {
    public readonly router: Router;
    private logger = new LoggerAdapter(XmsBrockerRouter)

    constructor(
        private xmsBrockerAcknowledgementService: XmsBrockerAcknowledgementService,
        private xmsBrockerReplyService: XmsBrockerReplyService
    ) {


        this.router = express.Router();
        this.router.use(json())
        this.router.post('/messages/ack', this.ack.bind(this))
        this.router.post('/messages/reply', this.reply.bind(this))
    }

    async ack(req: Request, res: Response, next: NextFunction) {
        const hubMessageId = req.body.MsgId;
        const acknowledgementStatusCode = req.body.Status;

        if (hubMessageId === undefined) {
            this.logger.debug('missing parameter : MsgId')
            res.status(400).send('missing parameter : MsgId')
            return
        }

        if (acknowledgementStatusCode === undefined) {
            this.logger.debug('missing parameter : Status')
            res.status(400).send('missing parameter : Status')
            return
        }

        await this.xmsBrockerAcknowledgementService.acknowledge(hubMessageId, parseInt(acknowledgementStatusCode));

        res
            .contentType('text/plain')
            .status(200)
            .send('Status=0')
    }


    async reply(req: Request, res: Response, next: NextFunction) {
        const shortCode = req.body.DA;
        const sender = req.body.SOA;
        const content = req.body.content ?? '';
        const timeCreated = req.body.TimeCreated;
        const textUdhValue = this.extractTextUdhValue(req.body.Headers);
        const mmsContentType = this.extractContentType(req.body.Headers);

        if (shortCode === undefined) {
            this.logger.debug('missing parameter : DA')
            res.status(400).send('missing parameter : DA')
            return
        }

        if (sender === undefined) {
            this.logger.debug('missing parameter : SOA')
            res.status(400).send('missing parameter : SOA')
            return
        }

        if (timeCreated === undefined) {
            this.logger.debug('missing parameter : TimeCreated')
            res.status(400).send('missing parameter : TimeCreated')
            return
        }

        // le MsgType = 6 (mms) peut être accepté s'il s'agit d'un long sms sans attachement : !mms.attachments.length
        if (req.body.MsgType && (req.body.MsgType !== 0 && req.body.MsgType !== 6)) {
            this.logger.debug('missing parameter : MsgType should be set to 0 or 6 or not')
            res.status(400).send('parameter MsgType should be set to 0 or 6')
            return
        }

        if(req.body.MsgType && req.body.MsgType === 6 && mmsContentType.length === 0){
            this.logger.debug('missing parameter : mmsContentType in Header field should be set when MsgType is 6')
            res.status(400).send('missing parameter : mmsContentType in Header field should be set when MsgType is 6')
            return
        }

        //check destination phone number

        //messageData.sender = PhoneNumberService.getNormalizedNumber(messageData.sender)
        try {
            await this.xmsBrockerReplyService.reply(shortCode, sender, content, timeCreated, textUdhValue, mmsContentType)
        } catch (e) {
            if (e instanceof BadFormatUdhValueError) {
                res.status(400).send('parameter TextUDHValue should be start by to 05 or 06')
                return
            }
        }

        res
            .contentType('text/plain')
            .status(200)
            .send('Status=0')
    }


    private parseHeaders(headersBlock: string) {
        const result = new Map();

        if (!headersBlock) {
            return result;
        }

        const headers = headersBlock.trim().split(/[\n\r]+/);

        headers.forEach((header) => {
            const match = header.trim().match(/^([^:]+?):(.+)$/);
            const name = match![1].trim().toLowerCase();

            result.set(name, match![2].trim());
        });

        return result;
    }

    private extractTextUdhValue(headers: string) {
        return this.parseHeaders(headers).get('textudhvalue') || ''
    }
    private extractContentType(headers: string) {
        return this.parseHeaders(headers).get('content-type') || ''
    }
}


/* Pour le /messages/ack
d'après les log
les params :
SUBJECT
ORDERID
STATUS
ne servent à rien.
 */

// a quoi sert cette partie ?
// if (origin === 'HUB' && !statusCode) {
//                 return response;
//             }


// besoin de ce controle, tous les logs sur l'url ack sont en fromHub ?
// test fromHub dans la query
// sinon error bad format, missing parameter

// pourquoi besoin de rafraichir les info wassup du user ?
// récup le ULO


