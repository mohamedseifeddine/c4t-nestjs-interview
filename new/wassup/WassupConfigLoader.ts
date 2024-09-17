export class WassupConfigLoader {


    /*
    if (['dev', 'preprod'].includes(process.env.PLATFORM!)) {
            return DatabaseConfigBuilder.parseDevConfig(process.env.VCAP_SERVICES!)
        }

     */
    static getLocalConfig() {
        return 'https://vip-rpecm-wup-ints.itn.intraorange';
    }

    static getQualifConfig() {
        return 'https://wassup-ints.itn.intraorange'
    }

    static getPreprodConfig() {
        return 'https://wassuppriv-ofr.itn.ftgroup'
    }

    static loadConfig() {
        if(['dev', 'qualif'].includes(process.env.PLATFORM!)){
            return WassupConfigLoader.getQualifConfig()
        }
        if(process.env.PLATFORM! === 'preprod'){
            return WassupConfigLoader.getPreprodConfig()
        }
        return WassupConfigLoader.getLocalConfig()
    }
}
