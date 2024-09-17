import {GeolocConfigBuilder} from "./GeolocConfigBuilder";
import {GeolocConfig} from "./GeolocConfig";
import * as devEnv from '../cloudfoundry/sample/devEnv.json'
import * as qaEnv from '../cloudfoundry/sample/qualifEnv.json'

describe('GeolocConfigBuilder', () => {

    test('load dev conf', () => {
        const geolocConfig = GeolocConfigBuilder.parseDevConfig(JSON.stringify(devEnv.VCAP_SERVICES));

        expect(geolocConfig).toEqual(
            new GeolocConfig(
                'aGeolocUrl',
                'aGeolocUser',
                `aGeolocPassword`,
                "http://aUserName:aPassword@internet-proxy.service.internal:3128"));
    })

    test('load qualif conf', () => {
        const geolocConfig = GeolocConfigBuilder.parseQualifConfig(JSON.stringify(qaEnv.VCAP_SERVICES));

        expect(geolocConfig).toEqual(
            new GeolocConfig(
                'aGeolocUrl',
                'aGeolocUser',
                `aGeolocPassword`,
                "http://aUserName:aPassword@internet-proxy.service.internal:3128"));
    })

})
