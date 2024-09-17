import {GeolocError} from "./GeolocError";
import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {load as cheerioLoad} from "cheerio";
import {GeolocConfigBuilder} from "./GeolocConfigBuilder";
import {HttpsProxyAgent} from "https-proxy-agent";
import {GeolocAdapterPort} from "./GeolocAdapterPort";
import {PartnerLoggerAdapter} from "../logger/PartnerLoggerAdapter";
import {SessionInfo} from "../globalMiddlewares/SessionInfo";
import {MyResponse} from "../httpCall/Response";
import {HttpPartnerInfoForLog} from "../logger/HttpPartnerInfoForLog";
import {HttpPartnerRequestInfoForLog} from "../logger/HttpPartnerRequestInfoForLog";
import {HttpPartnerResponseInfoForLog} from "../logger/HttpPartnerResponseInfoForLog";

export default class GeolocAdapter extends GeolocAdapterPort {

    async getCountryForIp(ip: string) {
        const geolocConfig = GeolocConfigBuilder.loadConfig()
        const timeout = 2000;
        const headers: any = {};
        const partnerLogger = new PartnerLoggerAdapter(
            GeolocAdapter,
            new HttpPartnerInfoForLog(
                'geoloc',
                'GET',
                geolocConfig.url,
                timeout
            )
        )
        headers['x-request-id'] = SessionInfo.requestId()
        headers['x-forwarded-for'] = SessionInfo.xForwardedFor()

        partnerLogger.beforeCall(new HttpPartnerRequestInfoForLog(headers, {ip: ip}));

        let response: AxiosResponse;
        const config: AxiosRequestConfig = {
            auth: {
                username: geolocConfig.user,
                password: geolocConfig.password
            },
            headers: headers,
            params: {
                ip: ip
            },
            timeout: timeout
        };

        if (geolocConfig.proxy) {
            config.httpsAgent = new HttpsProxyAgent(geolocConfig.proxy);
        }

        try {
            response = await axios.get(geolocConfig.url, config);
        } catch (err: any) {
            partnerLogger.errorOnCall(new HttpPartnerResponseInfoForLog(
                err.status,
                err.response,
                MyResponse.responseSize(err.response)
            ))
            throw err;
        }

        const get = cheerioLoad(response.data, {xmlMode: true});
        const body = get('geoloc');

        const responseStatus = parseInt(body.find('status').text(), 10);

        if (responseStatus !== 0) {
            throw new GeolocError()
        }

        const country = body.find('country > code').text();

        partnerLogger.afterCall(new HttpPartnerResponseInfoForLog(
            response.status,
            country,
            MyResponse.responseSize(response)
        ))

        return country;
    }
}
