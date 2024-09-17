import * as qs from 'qs';
import { MailApiError } from './Errors/MailApiError';
import { User } from '../User/User';
import axios from 'axios';
import { PartnerLoggerAdapter } from '../logger/PartnerLoggerAdapter';
import { HttpPartnerInfoForLog } from '../logger/HttpPartnerInfoForLog';
import { HttpPartnerResponseInfoForLog } from '../logger/HttpPartnerResponseInfoForLog';
import { MyResponse } from '../httpCall/Response';
import { HttpPartnerRequestInfoForLog } from '../logger/HttpPartnerRequestInfoForLog';
import { MailAdapterPort } from './NewMailAdapterPort';

class NewMailAdapter implements MailAdapterPort {
    private newMailAdapter: PartnerLoggerAdapter;
    private mailDepositVerbUrl: string;

    constructor() {
        this.newMailAdapter = new PartnerLoggerAdapter(
            NewMailAdapter,
            new HttpPartnerInfoForLog("IN8", "POST", `${process.env.IN8_SERVICE_URL}/depositMessage.xml`, axios.defaults.timeout!)
        );
        this.mailDepositVerbUrl = `${process.env.IN8_SERVICE_URL}/depositMessage.xml`;
    }    
    async depositMessage(
        user: User,
        mail: string,
        options: Record<string, unknown> | null = null
    ): Promise<any> {
        this.newMailAdapter.beforeCall( new HttpPartnerRequestInfoForLog(mail, {}))
        try {            
            const response = await axios.post(this.mailDepositVerbUrl, mail, {
                headers: {
                    'X-Mail-From': user.ulo,
                    'Content-Type': 'message/rfc822',
                },
                params: qs.stringify(options, { arrayFormat: 'repeat' }),
                timeout: 30000,
                responseType: 'text', 
            });
        
            if (response.status !== 200) {
                throw new MailApiError('Deposit message failed', response.status);
            }
            this.newMailAdapter.afterCall(
                new HttpPartnerResponseInfoForLog(
                  response.status,
                  "Message deposited successfully",
                  MyResponse.responseSize(response)
                )
              );
              return response
        } catch (error:any) {
           this.newMailAdapter.errorOnCall(
            new HttpPartnerResponseInfoForLog(
              error.status,
              error.response,
              MyResponse.responseSize(error)
            )
          );
            throw new MailApiError('Error depositing message', error.status || 500);
        }
    }    
}

export { NewMailAdapter };

