export abstract class GeolocAdapterPort {
    abstract getCountryForIp(ip: string): Promise<string>
}
