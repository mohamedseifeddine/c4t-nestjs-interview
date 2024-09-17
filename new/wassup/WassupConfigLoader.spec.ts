import {WassupConfigLoader} from "./WassupConfigLoader";

describe('WassupConfigLoader', () => {
    test('return local config', () => {
        const wassupUrl = WassupConfigLoader.getLocalConfig();

        expect(wassupUrl).toEqual('https://vip-rpecm-wup-ints.itn.intraorange');
    })

    test('return qualif config', () => {
        const wassupUrl = WassupConfigLoader.getQualifConfig();

        expect(wassupUrl).toEqual('https://wassup-ints.itn.intraorange');
    })

    test('return preprod config', () => {
        const wassupUrl = WassupConfigLoader.getPreprodConfig();

        expect(wassupUrl).toEqual('https://wassuppriv-ofr.itn.ftgroup');
    })

})
