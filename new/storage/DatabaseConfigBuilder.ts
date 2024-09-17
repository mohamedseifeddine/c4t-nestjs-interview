
export class DatabaseConfigBuilder {

    static parseQualifConfig(vcapService:string): string{
        const {host,port,username,password,database} = JSON.parse(vcapService)['user-provided'][0].credentials
        return `mongodb://${username}:${password}@${host}:${port}/${database}?tlsInsecure=true&ssl=true`
    }
    static parsePreprodConfig(vcapService:string): string{
        const {host,port,username,password,database} = JSON.parse(vcapService)['user-provided'][0].credentials
        return `mongodb://${username}:${password}@${host}:27017/${database}?tlsInsecure=true&ssl=true`
    }
    static parseDevConfig(vcapService: string) {
        const {host,ports,username,password,database}= JSON.parse(vcapService).mongodb[0].credentials
        return `mongodb://${username}:${password}@${host}:${ports[0]}/${database}?tlsInsecure=true&ssl=true`
    }

    static loadConfig() {
        if (process.env.PLATFORM === 'gitlab-runner') {
            return 'mongodb://localhost:27017'
        }
        if(process.env.PLATFORM === 'dev'){
            return DatabaseConfigBuilder.parseDevConfig(process.env.VCAP_SERVICES!)
        }
        if(process.env.PLATFORM === 'qualif'){
            return DatabaseConfigBuilder.parseQualifConfig(process.env.VCAP_SERVICES!)
        }
        if(process.env.PLATFORM === 'preprod'){
            return DatabaseConfigBuilder.parsePreprodConfig(process.env.VCAP_SERVICES!)
        }
        return 'mongodb://localhost:27017/dbForTest'
    }


}
