import * as devEnv from '../../../cloudfoundry/sample/devEnv.json';
import * as qaEnv from '../../../cloudfoundry/sample/qualifEnv.json';
import { PnsAdapterPort } from "../../domain/port/PnsAdapterPort";
import { SessionInfoDto } from "../../types/types";
import { OkapiAdapter } from "./OkapiAdapter/OkapiAdapter";
import { OkapiAdapterPort } from "./OkapiAdapter/OkapiAdapterPort";
import { PnsAdapter } from "./PnsAdapter";

describe("Pns Adapter E2E Tests:", () => {
  let pnsAdapter: PnsAdapterPort;
  let okapiAdapter: OkapiAdapterPort;
  let userId:string

  beforeEach(() => {
    okapiAdapter = new OkapiAdapter()
    pnsAdapter = new PnsAdapter();
    userId = "ID-SMS-100-nEAKcHiGfa9YCWGbVz16FjVhBSlqdal4DqD9bTyVvz8"
  });

  test("Notify successfully in dev env", async () => {
    const request: SessionInfoDto = {
      id: "test-id",
      remoteIp: "127.0.0.1",
    };
    const vcapServicesData = JSON.stringify(devEnv.VCAP_SERVICES);
    process.env.VCAP_SERVICES = vcapServicesData;
    const token = await okapiAdapter.getTokenFromOkapi()
    await expect(pnsAdapter.notify(request, userId,1,token)).resolves.not.toThrow();
  });
  test("Notify successfully in qualif env", async () => {
    const request: SessionInfoDto = {
      id: "test-id",
      remoteIp: "127.0.0.1",
    };
    const vcapServicesData = JSON.stringify(qaEnv.VCAP_SERVICES);
    process.env.VCAP_SERVICES = vcapServicesData;
    const token = await okapiAdapter.getTokenFromOkapi()
    await expect(pnsAdapter.notify(request, userId,1,token)).resolves.not.toThrow();
  });
  
  test("Notify successfully in local env", async () => {
    const request: SessionInfoDto = {
      id: "test-id",
      remoteIp: "127.0.0.1",
    };
    const token = await okapiAdapter.getTokenFromOkapi()
    await expect(pnsAdapter.notify(request, userId,1,token)).resolves.not.toThrow();
  });
    
});
