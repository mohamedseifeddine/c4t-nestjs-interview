import * as devEnv from '../../../cloudfoundry/sample/devEnv.json';
import * as qaEnv from '../../../cloudfoundry/sample/qualifEnv.json';
import { VcapServicesLoader } from '../../../config/VcapServicesLoader';
import { InternalErrorHttpError } from '../../../httpCall/InternalErrorHttpError';
import { PnsConfig, PnsConfigLoader } from './PnsConfigLoader';

    describe('PnsConfigLoader', () => {
        beforeEach(() => {
            process.env = { ...process.env };
        });
        test('load dev PnsConfig when VCAP_SERVICES is correctly parsed', () => {
            process.env.PLATFORM = "dev"
            const vcapServicesData = JSON.stringify(devEnv.VCAP_SERVICES);
            process.env.VCAP_SERVICES = vcapServicesData;
            const vcapServicesParsed = VcapServicesLoader.loadUserProvidedService("pns-valkey");
            const credential = vcapServicesParsed.credentials;
            const expectedConfig: PnsConfig = {
                country: "FR",
                serviceId: "ID-SMS",
                originCaller: "webxms-omi-gp",
                url: "https://valkey.rec.api.hbx.geo.infra.ftgroup/pns/v3",
                timeout: 10000,
                rejectUnauthorized: false,
                okapiConfig: {
                    url: "https://okapi-v2.api.hbx.geo.infra.ftgroup/v2/token",
                    clientSecret: credential.clientSecret,
                    scope: "api-valkey-v3-npd:readwrite",
                    keepAlive: false,
                    timeout: 10000,
                    clientId: credential.clientId,
                    rejectUnauthorized: false,
                }
            };

            const pnsConfig = PnsConfigLoader.loadConfig();

            expect(pnsConfig).toEqual(expectedConfig);
        });

        test('load qualif PnsConfig when VCAP_SERVICES is correctly parsed', () => {
            process.env.PLATFORM = "qualif"
            const vcapServicesData = JSON.stringify(qaEnv.VCAP_SERVICES);
            process.env.VCAP_SERVICES = vcapServicesData;
            const vcapServicesParsed = VcapServicesLoader.loadUserProvidedService("pns-valkey");
            const credential = vcapServicesParsed.credentials;
            const expectedConfig: PnsConfig = {
                country: "FR",
                serviceId: "ID-SMS",
                originCaller: "webxms-omi-gp",
                url: "https://valkey.rec.api.hbx.geo.infra.ftgroup/pns/v3",
                timeout: 10000,
                rejectUnauthorized: false,
                okapiConfig: {
                    url: "https://okapi-v2.api.hbx.geo.infra.ftgroup/v2/token",
                    clientSecret: credential.clientSecret,
                    scope: "api-valkey-v3-npd:readwrite",
                    keepAlive: false,
                    timeout: 10000,
                    clientId: credential.clientId,
                    rejectUnauthorized: false,
                }
            };

            const pnsConfig = PnsConfigLoader.loadConfig();

            expect(pnsConfig).toEqual(expectedConfig);
        });

        test('load preprod PnsConfig when VCAP_SERVICES is correctly parsed', () => {
            const vcapServicesData = JSON.stringify(qaEnv.VCAP_SERVICES);
            process.env.PLATFORM = "preprod"
            process.env.VCAP_SERVICES = vcapServicesData;
            const vcapServicesParsed = VcapServicesLoader.loadUserProvidedService("pns-valkey");
            const credential = vcapServicesParsed.credentials;
            const expectedConfig: PnsConfig = {
                country: "FR",
                serviceId: "ID-SMS",
                originCaller: "webxms-omi-gp",
                url: "https://valkey.rec.api.hbx.geo.infra.ftgroup/pns/v3",
                timeout: 10000,
                rejectUnauthorized: false,
                okapiConfig: {
                    url: "https://okapi-v2.api.hbx.geo.infra.ftgroup/v2/token",
                    clientSecret: credential.clientSecret,
                    scope: "api-valkey-v3-npd:readwrite",
                    keepAlive: false,
                    timeout: 10000,
                    clientId: credential.clientId,
                    rejectUnauthorized: false,
                }
            };

            const pnsConfig = PnsConfigLoader.loadConfig();

            expect(pnsConfig).toEqual(expectedConfig);
        });

        test("throws InternalErrorHttpError when VCAP_SERVICES is not defined", () => {
            process.env.PLATFORM = "dev"
            delete process.env.VCAP_SERVICES;
            expect(() => PnsConfigLoader.loadConfig()).toThrow(InternalErrorHttpError);
        });

        test('load gitlab PnsConfig when tests running in the gitlab runner', () => {
            process.env.PLATFORM = "gitlab-runner"
            process.env.CF_PNS_SERVICE_STAGING = JSON.stringify({
                "clientSecret": "aClientSecret",
                "scope": "api-valkey-v3-npd:readwrite",
                "keepAlive": false,
                "timeout": 10000,
                "clientId": "aClientId"
            })
            const expectedConfig: PnsConfig = {
                country: "FR",
                serviceId: "ID-SMS",
                originCaller: "webxms-omi-gp",
                url: "https://valkey.rec.api.hbx.geo.infra.ftgroup/pns/v3",
                timeout: 10000,
                rejectUnauthorized: false,
                okapiConfig: {
                    url: "https://okapi-v2.api.hbx.geo.infra.ftgroup/v2/token",
                    clientSecret: "aClientSecret",
                    scope: "api-valkey-v3-npd:readwrite",
                    keepAlive: false,
                    timeout: 10000,
                    clientId: "aClientId",
                    rejectUnauthorized: false,
                }
            };

            const pnsConfig = PnsConfigLoader.loadConfig();

            expect(pnsConfig).toEqual(expectedConfig);
        });
    });

