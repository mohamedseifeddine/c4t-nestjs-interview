import * as devEnv from '../../cloudfoundry/sample/devEnv.json';
import * as pprodEnv from '../../cloudfoundry/sample/pprodEnv.json';
import * as qualifEnv from '../../cloudfoundry/sample/qualifEnv.json';
import { ShortCodeConfigBuilder } from "./ShortCodeConfigBuilder";

describe('ShortCodeConfigBuilder', () => {

    test('load local conf', () => {
        const shortCodeConfigBuilder = ShortCodeConfigBuilder.parseLocalConfig();

        expect(shortCodeConfigBuilder.shortCodesReplyables[0].senderAddress).toEqual("aReplyableSenderadress0");
        expect(shortCodeConfigBuilder.shortCodeNoReply.senderAddress).toEqual("aNoReplySenderadress");
        expect(shortCodeConfigBuilder.shortCodeInternational.senderAddress).toEqual("aInterSenderadress");
    })

    test('load dev conf', () => {
        const shortCodeList = ShortCodeConfigBuilder.parseDevConfig(JSON.stringify(devEnv.VCAP_SERVICES));

        expect(shortCodeList.shortCodesReplyables[0].senderAddress).toEqual("webxmsCR");
        expect(shortCodeList.shortCodeNoReply.senderAddress).toEqual("noReply");
        expect(shortCodeList.shortCodeInternational.senderAddress).toEqual("inter");
    })

    test('load qualif conf', () => {
        const shortCodeList = ShortCodeConfigBuilder.parseQualifConfig(JSON.stringify(qualifEnv.VCAP_SERVICES));

        expect(shortCodeList.shortCodesReplyables[0].senderAddress).toEqual("webxmsCR");
       
        expect(shortCodeList.shortCodeNoReply.senderAddress).toEqual("noReply");
        expect(shortCodeList.shortCodeInternational.senderAddress).toEqual("inter");
    })

    test('load preprod conf', () => {
        const shortCodeList = ShortCodeConfigBuilder.parsePreprodConfig(JSON.stringify(pprodEnv.VCAP_SERVICES));

        expect(shortCodeList.shortCodesReplyables[0].senderAddress).toEqual("webxmsCP");
        expect(shortCodeList.shortCodeNoReply.senderAddress).toEqual("noReply");
        expect(shortCodeList.shortCodeInternational.senderAddress).toEqual("inter");
    })
})
