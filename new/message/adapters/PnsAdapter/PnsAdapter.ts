import axios from "axios";
import https from "node:https";
import { DateProvider } from "../../../date-provider/DateProvider";
import { PnsPartnerError } from "../../../httpCall/PnsPartnerError";
import { MyResponse } from "../../../httpCall/Response";
import { HttpPartnerInfoForLog } from "../../../logger/HttpPartnerInfoForLog";
import { HttpPartnerRequestInfoForLog } from "../../../logger/HttpPartnerRequestInfoForLog";
import { HttpPartnerResponseInfoForLog } from "../../../logger/HttpPartnerResponseInfoForLog";
import { PartnerLoggerAdapter } from "../../../logger/PartnerLoggerAdapter";
import { PnsAdapterPort } from "../../domain/port/PnsAdapterPort";
import { SessionInfoDto } from "../../types/types";
import { PnsConfigLoader } from "./PnsConfigLoader";

export class PnsAdapter implements PnsAdapterPort {
  private pnsApiPartnerLogger = new PartnerLoggerAdapter(
    PnsAdapter,
    new HttpPartnerInfoForLog("PNS", "POST", "odiUrl", axios.defaults.timeout!)
  );
  constructor(
  ) {
  }

  async notify(sessionInfoDto: SessionInfoDto, userId:string,unreadSms: number,token:string) {
    
      const config = PnsConfigLoader.loadConfig();
      const headers = Object.assign({
        accept: "application/json",
        "X-PNS-Country": config.country,
        "X-PNS-SID": config.serviceId,
        "X-Origin-Caller": config.originCaller,
        "X-PNS-Request-Id": sessionInfoDto.id,
        "content-type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      });

      if (sessionInfoDto.remoteIp) {
        headers["x-forwarded-for"] = sessionInfoDto.remoteIp;
      }

      const query = {
        users: [
          {
            credentials: {
              ise: userId,
            },
            fields: {
              NoSMS: unreadSms,
            },
            options: {
              timestamp: DateProvider.now().getTime(),
            },
          },
        ],
      };
      this.pnsApiPartnerLogger.beforeCall(
        new HttpPartnerRequestInfoForLog(headers, {})
      );
      try {
      const response = await axios.patch(`${config.url}/users`, query, {
        headers,
        timeout: config.timeout,
        httpsAgent: new https.Agent({
          rejectUnauthorized: config.rejectUnauthorized,
        }),
      });
      
      this.pnsApiPartnerLogger.afterCall(
        new HttpPartnerResponseInfoForLog(
          response.status,
          "",
          MyResponse.responseSize(response)
        )
      );
    } catch (error: any) {

      this.pnsApiPartnerLogger.error("error with : %s", error);
      this.pnsApiPartnerLogger.errorOnCall(
        new HttpPartnerResponseInfoForLog(
          error.status,
          error.response,
          MyResponse.responseSize(error)
        )
      ); 
      
      throw new PnsPartnerError(error.response.data.error.description)
    }
  }
}
