import { InternalErrorHttpError } from "../httpCall/InternalErrorHttpError";
import { VcapServicesLoader } from "./VcapServicesLoader";

describe('VcapServicesLoader', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    test("throws internal error when VCAP_SERVICES env variable is not defined", () => {
        delete process.env.VCAP_SERVICES;
        expect(() => VcapServicesLoader.loadUserProvidedService('')).toThrow(InternalErrorHttpError);
    });

    test("returns service details when VCAP_SERVICES is defined", () => {
        const vcapServices = JSON.stringify({
            "user-provided":[{
                    name: "someService",
                    credentials: { username: "testUser", password: "testPassword" }
            }]
        });

        process.env.VCAP_SERVICES = vcapServices;

        const service = VcapServicesLoader.loadUserProvidedService('someService');

        expect(service).toEqual({
            name: "someService",
            credentials: { username: "testUser", password: "testPassword" }
        });
    });

    test("returns undefined when service is not found in VCAP_SERVICES", () => {
        const vcapServices = JSON.stringify({
            "user-provided":[{
                    name: "someService",
                    credentials: { username: "testUser", password: "testPassword" }
            }]
        });

        process.env.VCAP_SERVICES = vcapServices;

        const service = VcapServicesLoader.loadUserProvidedService('serviceNotFound');

        expect(service).toBeUndefined();
    });
});
