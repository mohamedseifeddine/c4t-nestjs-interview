import { InternalErrorHttpError } from "../httpCall/InternalErrorHttpError";

export class VcapServicesLoader {
    static loadUserProvidedService(service:string){
        if(process.env.VCAP_SERVICES == undefined){
            throw new InternalErrorHttpError("")
            // todo log error
        }
        const vcapServicesParsed = JSON.parse(process.env.VCAP_SERVICES!);
        return vcapServicesParsed["user-provided"]?.filter((conf:any)=>conf.name === service)[0]
    }
}