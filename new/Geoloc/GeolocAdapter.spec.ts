import {GeolocError} from "./GeolocError";
import GeolocAdapter from "./GeolocAdapter";
import {GeolocAdapterInMemory} from "./GeolocAdapterInMemory";

describe.each([['GeolocAdapter real',GeolocAdapter], ['GeolocAdapter in memory', GeolocAdapterInMemory]])
('Geoloc Adapter %s', (geolocAdapterType:string, geolocAdapter) => {

    test.each([
        ['193.253.78.1', 'FR'],
        ['213.150.169.18', 'TN']
    ])('call getIpInformation succeed', async (ip, country) => {

        const ipCountry = await new geolocAdapter().getCountryForIp(ip);

        expect(ipCountry).toEqual(country);
    });

    test('call getIpInformation fail', async () => {
        const ip = 'invalidIpAddress';

        await expect(new geolocAdapter().getCountryForIp(ip)).rejects.toThrow(GeolocError);
    });

});
