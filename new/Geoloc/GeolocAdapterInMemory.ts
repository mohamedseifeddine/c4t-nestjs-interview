import {GeolocAdapterPort} from "./GeolocAdapterPort";
import {GeolocError} from "./GeolocError";

export class GeolocAdapterInMemory extends GeolocAdapterPort {
    async getCountryForIp(ip: string) {
        if (ip.startsWith('193')) {
            return 'FR'
        }
        if (ip.startsWith('213')) {
            return 'TN'
        }
        throw new GeolocError();
    }
}
