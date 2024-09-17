import * as localEnv from '../../../cloudfoundry/sample/localEnv.json';
import { VcapServicesLoader } from "../../../config/VcapServicesLoader";

export type OkapiConfig = {
    url: string,
    clientSecret: string,
    clientId: string,
    scope: string,
    keepAlive: boolean,
    timeout: number,
    rejectUnauthorized: boolean
}

export type PnsConfig = {
    country: string,
    serviceId: string,
    originCaller: string,
    url: string,
    timeout: number,
    rejectUnauthorized: boolean,
    okapiConfig: OkapiConfig
}
export class PnsConfigLoader {

    static getConfig(credentials:any): PnsConfig {
        return {
            country: "FR",
            serviceId: "ID-SMS",
            originCaller: "webxms-omi-gp",
            url: "https://valkey.rec.api.hbx.geo.infra.ftgroup/pns/v3",
            timeout: 10000,
            rejectUnauthorized: false,
            okapiConfig: {
                url: "https://okapi-v2.api.hbx.geo.infra.ftgroup/v2/token",
                clientSecret: credentials.clientSecret,
                scope: "api-valkey-v3-npd:readwrite",
                keepAlive: false,
                timeout: 10000,
                clientId: credentials.clientId,
                rejectUnauthorized: false,
            }
        }
    }

    static loadConfig() {
        if(['dev', 'qualif','preprod'].includes(process.env.PLATFORM!)){
            const vcapServicesParsed = VcapServicesLoader.loadUserProvidedService("pns-valkey");
            return PnsConfigLoader.getConfig(vcapServicesParsed.credentials)
        }
        if(process.env.PLATFORM! === "gitlab-runner"){            
            const credentials = <OkapiConfig><unknown>JSON.parse(process.env.CF_PNS_SERVICE_STAGING!)
            return PnsConfigLoader.getConfig(credentials)
        }
        const okapiLocalConfig = localEnv?.VCAP_SERVICES["user-provided"]?.filter((conf:any)=>conf.name === "pns-valkey")[0].credentials
        return PnsConfigLoader.getConfig(okapiLocalConfig)
    }
}
