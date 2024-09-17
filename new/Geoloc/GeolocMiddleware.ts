import {NextFunction, Request, RequestHandler, Response} from "express";
import {LoggerAdapter} from "../logger/LoggerAdapter";
import {GeolocAdapterPort} from "./GeolocAdapterPort";
import {GeolocError} from "./GeolocError";


export default class GeolocMiddleware {

    private logger = new LoggerAdapter(GeolocMiddleware);


    constructor(private geolocAdapter: GeolocAdapterPort) {
    }


    isIpAllwaysOk(req: any) {
        const ipWhitelist = ["10.107.74.36", "10.107.74.37", "10.99.54.39", "10.107.71.143", "10.107.71.144", "10.107.71.145", "10.107.71.146", "10.107.71.175", "10.107.71.176", "193.252.149.222", "109.166.219.218", "122.180.249.89", "10.107.2.155", "10.115.64.185", "10.99.91.143", "10.99.54.45", "10.99.54.47", "10.99.54.66", "10.99.54.67", "10.99.54.68", "10.99.54.69", "10.99.54.70", "10.99.54.71", "10.99.54.72", "10.99.54.73", "10.99.54.74", "10.99.54.75", "10.99.54.76", "10.99.54.77", "10.99.54.78", "10.99.54.97", "10.99.54.98", "10.99.91.141", "10.99.91.142", "10.99.91.143", "10.99.54.,9", "10.99.54.40", "10.99.54.41", "10.234.52.41", "10.234.52.46", "10.98.128.47", "10.98.128.48", "10.234.72.18", "10.234.72.19", "10.234.50.134", "10.234.50.133", "10.234.76.229", "10.234.76.230", "172.22.90.225", "172.22.90.226", "172.22.90.227", "172.22.90.228", "172.22.90.229", "172.22.90.230", "172.22.90.231", "172.22.90.232", "172.22.90.233", "172.22.90.234", "172.22.92.1", "172.22.92.2", "172.22.92.3", "172.22.92.4", "172.22.92.5", "172.22.92.6", "172.22.92.7", "172.22.92.8", "172.22.92.9", "172.22.92.10", "94.124.130.137", "90.112.61.100", "10.98.128.90", "10.98.128.91", "10.98.128.75", "10.98.128.76", "10.98.128.77", "10.98.128.78", "10.98.128.79", "10.98.128.80", "10.98.128.81", "10.98.128.82", "10.98.128.83", "10.98.128.84", "10.98.128.85", "10.98.128.86", "10.98.128.87", "10.98.128.88", "10.98.128.89", "10.98.128.92", "10.98.128.93", "10.98.128.94", "10.234.84.171", "10.234.84.172", "10.234.84.173", "10.234.84.174", "10.234.84.175", "10.234.84.176", "10.234.84.177", "10.234.84.178", "10.234.84.179", "10.234.84.180", "10.234.84.181", "10.234.84.182", "10.234.84.183", "10.234.84.184", "10.234.84.185", "10.234.84.186", "10.234.84.187", "10.234.84.188", "10.234.84.189", "10.234.84.190", "10.107.12.235", "10.107.12.236", "10.107.12.237", "10.107.12.238", "10.107.12.239", "10.107.12.240", "10.107.12.241", "10.107.12.242", "10.107.12.243", "10.107.12.244", "10.107.12.245", "10.107.12.246", "10.107.12.247", "10.107.12.248", "10.107.12.249", "10.107.12.250", "10.107.12.251", "10.107.12.252", "10.107.12.253", "10.107.12.254", "10.99.54.65", "10.234.242.250", "10.234.242.251", "10.234.125.235", "10.234.125.236", "10.218.137.234", "10.218.137.236", "10.77.118.3", "10.129.247.24", "10.255.148.11"]

        if (req.path.startsWith('/health')) {
            return true;
        }
        this.logger.info(`[GeolocMiddleware] check plateform: ${process.env.PLATFORM}`)
        // Can't check on dev and qualif env. the field remoteIp is not ok on wampaas staging env.
        if (['dev', 'qualif'].includes(process.env.PLATFORM!)) {
            this.logger.info(`[GeolocMiddleware] allow platform: ${process.env.PLATFORM}`)
            return true
        }

        if (ipWhitelist.indexOf(req.remoteIp) !== -1) {
            return true;
        }
        return false;
    }

    async checkAllowIp(req: any) {
        if (this.isIpAllwaysOk(req)) {
            return true;
        }

        const allowedCountries = ["FR", "GF", "PF", "GP", "MQ", "YT", "MC", "NC", "RE", "PM", "TF", "WF", "BL", "MF"];
        const country = await this.geolocAdapter.getCountryForIp(req.remoteIp);
        if (allowedCountries.indexOf(country) === -1) {
            this.logger.info(`[GeolocMiddleware] Error country not allow: ${country}`)
            throw new GeolocError();
        }

        return true;
    }

    middleware(): RequestHandler {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                // voir pourquoi nous avons des requetes avec la méthode OPTIONS
                if (req.method === 'OPTIONS') {
                    next();
                    return;
                }
                await this.checkAllowIp(req);
                next();
            } catch (e) {
                if (e instanceof GeolocError) {
                    res.status(403).send({
                        'mnemo': 'FORBIDDEN_GEOLOC_COUNTRY',
                        'message': 'Your IP has been geolocated in a country that is not allowed to use the service'
                    })
                } else {
                    next(e);
                }
            }
        }
    }
}
