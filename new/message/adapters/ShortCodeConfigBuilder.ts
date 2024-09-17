import {ShortCodeInternational} from "../domain/model/ShortCodeInternational";
import {ShortCodeNoReply} from "../domain/model/ShortCodeNoReply";
import {ShortCodeReplyable} from "../domain/model/ShortCodeReplyable";

export class ShortCodeConfig {

    constructor(public readonly shortCodeNoReply: ShortCodeReplyable, public readonly shortCodeInternational: ShortCodeInternational, public readonly shortCodesReplyables: Array<ShortCodeReplyable>) {
    }
}

export class ShortCodeConfigBuilder {

    static createToken(clientId: string, clientSecret: string) {

        return "Basic" + " " + btoa(clientId + ":" + clientSecret)
    }

    static parseLocalConfig(): ShortCodeConfig {
        return new ShortCodeConfig(
            new ShortCodeNoReply("aNoReplySenderadress", ["10000"], "noReplyOdiAuthorization-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
            new ShortCodeInternational("aInterSenderadress", ["20000"], "interOdiAuthorization-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
            [
                new ShortCodeReplyable("aReplyableSenderadress0", ["30000"], "ReplyableOdiAuthorization0-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
            ]
        );
    }

    static parseDevConfig(vcapService: string) {
        const odi = (JSON.parse(vcapService))['user-provided'][1].credentials.odi;
        return this.createShortCodeConfigFromOdiService(odi);
    }

    static parseQualifConfig(vcapService: string) {
        const odi = (JSON.parse(vcapService))['user-provided'][2].credentials.odi;
        return this.createShortCodeConfigFromOdiService(odi);
    }

    static parsePreprodConfig(vcapService: string) {
        const odi = JSON.parse(vcapService)['user-provided'][2].credentials.odi;
        return this.createShortCodeConfigFromOdiService(odi);
    }

    private static createShortCodeConfigFromOdiService(odi: any) {
        const noReply = odi.find((shortCodeCode: any) => shortCodeCode.id === "noReply")
        const inter = odi.find((shortCodeCode: any) => shortCodeCode.id === "inter")
        const replaybles = odi.filter((shortCodeCode: any) => shortCodeCode.id !== "inter" && shortCodeCode.id !== "NoReply")

        const shortCodeReplyable = replaybles.map((el: any) => new ShortCodeReplyable(el.id, el.shortCodeList, ShortCodeConfigBuilder.createToken(el.clientId, el.clientSecret)))
        const shortCodeNoReply = new ShortCodeNoReply(noReply.id, noReply.shortCodeList, ShortCodeConfigBuilder.createToken(noReply.clientId, noReply.clientSecret));
        const shortCodeInternational = new ShortCodeInternational(inter.id, inter.shortCodeList, ShortCodeConfigBuilder.createToken(inter.clientId, inter.clientSecret))

        return new ShortCodeConfig(
            shortCodeNoReply,
            shortCodeInternational,
            shortCodeReplyable
        )
    }

    // to rename to significant name exp loadShortCodeConfigByEnv
    static loadShortCode() {
        switch (process.env.PLATFORM) {
            case 'dev':
                return ShortCodeConfigBuilder.parseDevConfig(process.env.VCAP_SERVICES!)
            case 'qualif':
                return ShortCodeConfigBuilder.parseQualifConfig(process.env.VCAP_SERVICES!)
            case 'preprod':
                return ShortCodeConfigBuilder.parsePreprodConfig(process.env.VCAP_SERVICES!)
            default:
                return ShortCodeConfigBuilder.parseLocalConfig()
        }

    }
}
