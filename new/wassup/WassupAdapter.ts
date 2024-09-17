import axios from 'axios';
import {WassupUser} from './WassupUser';
import {WassupAdapterPort} from "./WassupAdapterPort";
import {WassupConfigLoader} from "./WassupConfigLoader";
import {WassupUnknownUserError} from "./WassupUnknownUserError";
import {PartnerLoggerAdapter} from "../logger/PartnerLoggerAdapter";
import {MyResponse} from "../httpCall/Response";
import {HttpPartnerInfoForLog} from "../logger/HttpPartnerInfoForLog";
import {HttpPartnerRequestInfoForLog} from "../logger/HttpPartnerRequestInfoForLog";
import {HttpPartnerResponseInfoForLog} from "../logger/HttpPartnerResponseInfoForLog";


/*
//////
call with uid
add ise dans data avec la valeur puid
plus de cookie dans l'entête


/////
*/

export default class WassupAdapter extends WassupAdapterPort {
    private wassupUrl = WassupConfigLoader.loadConfig();
    private timeout = 5000;
    private logger = new PartnerLoggerAdapter(
        WassupAdapter,
        new HttpPartnerInfoForLog('wassup', 'GET', this.wassupUrl, this.timeout));

    private wantedFields = 'uid,uidpm,ucs,uit,msisdn,mts,ulo,ius,mus,usc,spr,sau,iur,mur,puid,mss';

    async getUserWithCookie(cookie: string): Promise<WassupUser> {
        const wassupResponse = await this.callWassupWithCookie(cookie);
        return this.managedWassupResponse(wassupResponse,);
    }

    async getUserWithUid(uid: string): Promise<WassupUser> {
        const wassupResponse = await this.callWassupWithUid(uid);
        return this.managedWassupResponse(wassupResponse);
    }


    private managedWassupResponse(wassupResponse: any) {
        const wassupStatus = wassupResponse.data.match(new RegExp('X_WASSUP_STATUS=([^\\n]*)', 'i'))

        if (wassupStatus[1] !== 'OK') {
            throw new WassupUnknownUserError()
        }

        const returnData: any = {}
        this.wantedFields.split(',').forEach((field) => {
            const match = wassupResponse.data.match(new RegExp(`X_WASSUP_${field.toUpperCase()}=([^\n]+)`, 'i'));

            if (match) {
                if (match[1] === 'UNAVAILABLE') {
                    returnData[field] = undefined;
                } else if (field === 'cooses') {
                    returnData[field] = match[1].replace(/^(.+?);.*$/, '$1');
                } else if (field === 'msisdn' || Number.isNaN(Number(match[1]))) {
                    returnData[field] = match[1];
                } else {
                    returnData[field] = parseInt(match[1], 10);
                }
            } else {
                returnData[field] = undefined;
            }
        });

        return new WassupUser(returnData['uid'], returnData['uit'], returnData['puid'], returnData['spr'], returnData['sau'], returnData['ulo'])
    }

    private async callWassupWithCookie(cookie: string) {
        const headers = {
            'Cookie': `wassup=${cookie}`,
        };

        return await this.callWassup(this.wantedFields, headers);
    }

    private async callWassupWithUid(uid: string) {
        return await this.callWassup(this.wantedFields, {}, {ise: uid});
    }

    private async callWassup(field: string, headers = {}, complementaryData = {}) {
        const data = {
            ...{
                serv: 'ID-SMS',
                wassup: 'ident',
                prot: '200',
                info: field,
            },
            ...complementaryData
        }

        this.logger.beforeCall(new HttpPartnerRequestInfoForLog(headers, data))

        try {
            const wassupResponse: any = await axios.get(this.wassupUrl, {
                headers,
                params: data,
                timeout: this.timeout
            })

            this.logger.afterCall(new HttpPartnerResponseInfoForLog(
                wassupResponse.statusCode,
                '',
                MyResponse.responseSize(wassupResponse)
            ))

            return wassupResponse;

        } catch (e: any) {
            this.logger.errorOnCall(new HttpPartnerResponseInfoForLog(
                e.status,
                e.response,
                MyResponse.responseSize(e.response)
            ))
            throw e;
        }
    }
}
