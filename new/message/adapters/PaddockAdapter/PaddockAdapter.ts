import axios from "axios";
import https from "https";
import {MyResponse} from "../../../httpCall/Response";
import {HttpPartnerInfoForLog} from "../../../logger/HttpPartnerInfoForLog";
import {HttpPartnerRequestInfoForLog} from "../../../logger/HttpPartnerRequestInfoForLog";
import {HttpPartnerResponseInfoForLog} from "../../../logger/HttpPartnerResponseInfoForLog";
import {PartnerLoggerAdapter} from "../../../logger/PartnerLoggerAdapter";
import {OdiInvalidClientError} from "../../Errors/OdiInvalidClientError";
import {OdiPartnerError} from "../../Errors/OdiPartnerError";
import {PaddockBadFormatPhoneNumberError} from "../../Errors/PaddockBadFormatPhoneNumberError";
import {PaddockPartnerError} from "../../Errors/PaddockPartnerError";
import {ShortCode} from "../../domain/model/ShortCode";
import {PaddockAdapterPort} from "../../domain/port/PaddockAdapterPort";

export class PaddockAdapter implements PaddockAdapterPort {
    async sendSMS(shortcode: ShortCode, messageContent: string, destinationPhoneNumber: string): Promise<string> {
        const odiUrl = 'https://inside01.api.intraorange/oauth/v3/token';
        const odiPartnerLogger = new PartnerLoggerAdapter(
            PaddockAdapter,
            new HttpPartnerInfoForLog(
                'ODI',
                'POST',
                odiUrl,
                axios.defaults.timeout!
            )
        )
        odiPartnerLogger.info(`odiAuttttth valueeee ${shortcode.odiAuthorization}`)
        const OdiBearerToken = await this.getOdiToken(shortcode.odiAuthorization);
        odiPartnerLogger.info(`odibeareer token value ${OdiBearerToken}`)
        odiPartnerLogger.info(`shortCode value ${shortcode}`)
        const paddockResponse = await this.sendSMSWithPaddock(shortcode.virtualShortCode[0], messageContent, destinationPhoneNumber, OdiBearerToken);

        const parsedLocation = paddockResponse.headers.location.split('/');
        return parsedLocation[parsedLocation.length - 1];
    }

    async getOdiToken(odiAuthorization: string): Promise<string> {
        // voir avec redis pour stocker 1 heure le résultat (a confirmer la duré de l'odiAuthorization
        const odiUrl = 'https://inside01.api.intraorange/oauth/v3/token';

        const odiPartnerLogger = new PartnerLoggerAdapter(
            PaddockAdapter,
            new HttpPartnerInfoForLog(
                'ODI',
                'POST',
                odiUrl,
                axios.defaults.timeout!
            )
        )
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: odiAuthorization,
        };
        odiPartnerLogger.beforeCall(new HttpPartnerRequestInfoForLog(headers, {}));

        try {
            const token = await axios.post(
                odiUrl,
                {
                    grant_type: 'client_credentials',
                },
                {
                    headers: headers,
                }
            );

            odiPartnerLogger.afterCall(new HttpPartnerResponseInfoForLog(
                token.status,
                'An Access Token - not visible in log',
                MyResponse.responseSize(token)
            ))

            return token?.data?.access_token;
        } catch (error: any) {
            odiPartnerLogger.error('error with : %s', error)
            odiPartnerLogger.errorOnCall(new HttpPartnerResponseInfoForLog(
                error.status,
                error.response,
                MyResponse.responseSize(error)
            ))
            if (error.response.data.error === 'invalid_client') {
                throw new OdiInvalidClientError();
            }
            throw new OdiPartnerError(error.message)
        }
    }

    private async sendSMSWithPaddock(shortcode: string, message: string, destinationPhoneNumber: string, OdiBearerToken: string) {
        const paddockUrl = 'https://inside01.api.intraorange/smsmessaging/dev/outbound';

        const paddockPartnerLogger = new PartnerLoggerAdapter(
            PaddockAdapter,
            new HttpPartnerInfoForLog(
                'XMS_BROKER',
                'POST',
                paddockUrl,
                axios.defaults.timeout!
            )
        )

        paddockPartnerLogger.beforeCall(new HttpPartnerRequestInfoForLog({}, {
            senderAddress: shortcode,
            recipient: {
                phone: destinationPhoneNumber,
                //country: recipientCountryCode  // TODO VOIR si utile
            },
            //msgNumber:msgNumber // TODO VOIR si utile
        }));
        try {
            const response = await axios.post(
                paddockUrl + '/tel%3A%2B33' +
                shortcode +
                '/requests',
                {
                    outboundSMSMessageRequest: {
                        address: 'tel:' + destinationPhoneNumber,
                        senderAddress: 'tel:+33' + shortcode,
                        outboundSMSTextMessage: {
                            message: message,
                        },
                        senderName: shortcode,
                    },
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + OdiBearerToken,
                    },
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                    }),
                }
            );
            paddockPartnerLogger.afterCall(new HttpPartnerResponseInfoForLog(
                response.status,
                response.data,
                MyResponse.responseSize(response)
            ))
            return response

        } catch (error: any) {
            paddockPartnerLogger.errorOnCall(new HttpPartnerResponseInfoForLog(
                error.status,
                error.response,
                MyResponse.responseSize(error)
            ))
            if (error?.response?.data?.requestError?.serviceException?.messageId === 'SVC0004') {
                throw new PaddockBadFormatPhoneNumberError(destinationPhoneNumber)
            }
            throw new PaddockPartnerError(error.message);
        }
    }
}
