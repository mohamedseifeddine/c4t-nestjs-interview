import axios, { AxiosHeaders } from "axios";
import https from "node:https";
import { MyResponse } from "../../../../httpCall/Response";
import { HttpPartnerInfoForLog } from "../../../../logger/HttpPartnerInfoForLog";
import { HttpPartnerRequestInfoForLog } from "../../../../logger/HttpPartnerRequestInfoForLog";
import { HttpPartnerResponseInfoForLog } from "../../../../logger/HttpPartnerResponseInfoForLog";
import { PartnerLoggerAdapter } from "../../../../logger/PartnerLoggerAdapter";
import { PnsConfig, PnsConfigLoader } from "../PnsConfigLoader";
import { OkapiAdapterPort } from "./OkapiAdapterPort";

export class OkapiAdapter implements OkapiAdapterPort {
  private okaApiPartnerLogger = new PartnerLoggerAdapter(
    OkapiAdapter,
    new HttpPartnerInfoForLog(
      "okapi",
      "POST",
      "okApi URL",
      axios.defaults.timeout!
    )
  );
  
  async getTokenFromOkapi() {
    
      const conf: PnsConfig = PnsConfigLoader.loadConfig();
      // TODO if token still valid get it from cache
      const clientIdSecret = `${Buffer.from(
        encodeURI(`${conf.okapiConfig.clientId}:${conf.okapiConfig.clientSecret}`)
      ).toString("base64")}`;
      const headers = new AxiosHeaders({
        "Content-Type": "application/x-www-form-urlencoded",
      });
      const data = new URLSearchParams({
        grant_type: "client_credentials",
        scope: conf.okapiConfig.scope,
      });
      const reqConfig = {
        headers,
        httpsAgent: new https.Agent({
          keepAlive: conf.okapiConfig.keepAlive,
          rejectUnauthorized: conf.okapiConfig.rejectUnauthorized,
        }),
        timeout: conf.okapiConfig.timeout,
      };
      this.okaApiPartnerLogger.beforeCall(
        new HttpPartnerRequestInfoForLog(headers, {})
      );
      try {
      headers.setAuthorization(`Basic ${clientIdSecret}`);
      const response = await axios.post(conf.okapiConfig.url, data, reqConfig);
      this.okaApiPartnerLogger.afterCall(
        new HttpPartnerResponseInfoForLog(
          response.status,
          "An Access Token - not visible in log",
          MyResponse.responseSize(response)
        )
      );
            
      return response.data.access_token;
    }catch (error: any) {
      if (error.response && error.response.status === 401) {
        this.okaApiPartnerLogger.error("Error with: %s", error.message);
        this.okaApiPartnerLogger.errorOnCall(
          new HttpPartnerResponseInfoForLog(
            error.response?.status,
            error.response?.data,
            MyResponse.responseSize(error)
          )
        );
        throw new Error('Authentication failed with status 401');
      }
      this.okaApiPartnerLogger.error("Unexpected error with: %s", error.message);
      this.okaApiPartnerLogger.errorOnCall(
        new HttpPartnerResponseInfoForLog(
          error.response?.status,
          error.response?.data,
          MyResponse.responseSize(error)
        )
      );
      throw error;
    }
  }
}
