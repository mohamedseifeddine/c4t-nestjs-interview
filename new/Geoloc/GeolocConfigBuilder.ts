import {GeolocConfig} from "./GeolocConfig";

export class GeolocConfigBuilder {

    static parseDevConfig(vcapService: string) {
        const vcapServicesParsed = JSON.parse(vcapService);
        const credential = vcapServicesParsed['user-provided'][0].credentials
        const proxyUrl = vcapServicesParsed['internet-proxy'][0].credentials.uri
        return new GeolocConfig(
            credential.url,
            credential.user,
            credential.password,
            proxyUrl
        )
    }

    static parseQualifConfig(vcapService: string) {
        const vcapServicesParsed = JSON.parse(vcapService);
        const credential = JSON.parse(vcapService)['user-provided'][1].credentials
        const proxyUrl = vcapServicesParsed['internet-proxy'][0].credentials.uri
        return new GeolocConfig(
            credential.url,
            credential.user,
            credential.password,
            proxyUrl
        )
    }

    static defaultConfig(){
        return new GeolocConfig(
            'https://geoloc.preprod.orange.fr/geoloc2',
            'webxms',
            'UmY3FL02+87183B'
        )
    }

    static loadConfig() {
        if (process.env.PLATFORM! === 'dev') {
            return GeolocConfigBuilder.parseDevConfig(process.env.VCAP_SERVICES!);
        }
        if (['qualif', 'preprod'].includes(process.env.PLATFORM!)) {
            return GeolocConfigBuilder.parseQualifConfig(process.env.VCAP_SERVICES!)
        }
        return GeolocConfigBuilder.defaultConfig();
    }

    /*
    prod
        GEOLOC_URL=https://geoloc-priv.multis.p.fti.net/geoloc2
        GEOLOC_PASSWORD=VAULT
        GEOLOC_USERNAME=webxms
        GEOLOC_TIMEOUT=2000
     */

}
