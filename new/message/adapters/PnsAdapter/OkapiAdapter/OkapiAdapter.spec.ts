import * as devEnv from "../../../../cloudfoundry/sample/devEnv.json";
import * as qaEnv from "../../../../cloudfoundry/sample/qualifEnv.json";
import { OkapiAdapter } from "./OkapiAdapter";
import { OkapiAdapterInMemory } from "./OkapiAdapterInMemory";
import { OkapiAdapterPort } from "./OkapiAdapterPort";
describe.each([[OkapiAdapter], [OkapiAdapterInMemory]])(
  "OkapiAdapterPort E2E test",
  (okapiAdapterC) => {
    let okapiAdapter: OkapiAdapterPort;
    beforeEach(() => {
      okapiAdapter = new okapiAdapterC();
    });
    test("fetch access token from okapi for dev env", async () => {
      const vcapServicesData = JSON.stringify(devEnv.VCAP_SERVICES);
      process.env.VCAP_SERVICES = vcapServicesData;

      const token = await okapiAdapter.getTokenFromOkapi();

      expect(token.length).toBeGreaterThan(0);
    });
    test("fetch access token from okapi for qualif env", async () => {
      const vcapServicesData = JSON.stringify(qaEnv.VCAP_SERVICES);
      process.env.VCAP_SERVICES = vcapServicesData;

      const token = await okapiAdapter.getTokenFromOkapi();

      expect(token.length).toBeGreaterThan(0);
    });

    // Run Only in InMemory tests
    if (okapiAdapterC === OkapiAdapterInMemory) {
      test("throw error when trying to fetch access token from okapi with wrong secret", async () => {
        process.env.VCAP_SERVICES = JSON.stringify({
          "user-provided": [
            {
              name: "pns-valkey",
              credentials: {
                clientSecret: "invalid-client-secret",
                clientId: "invalid-client-id",
              },
            },
          ],
        });
        (okapiAdapter as OkapiAdapterInMemory).throwError = true;
        await expect(okapiAdapter.getTokenFromOkapi()).rejects.toThrow(
          "Authentication failed with status 401"
        );
      });
    }
  }
);
