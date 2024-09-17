import { PnsPartnerError } from "../../../httpCall/PnsPartnerError";
import { PnsAdapterPort } from "../../domain/port/PnsAdapterPort";
import { SessionInfoDto } from "../../types/types";
import { OkapiAdapterPort } from "./OkapiAdapter/OkapiAdapterPort";

export class PnsAdapterInMemory implements PnsAdapterPort {
  private shouldThrowError: boolean = false;

  constructor(
    private readonly okapiAdapter: OkapiAdapterPort
  ) {
  }

  setThrowError(shouldThrow: boolean) {
    this.shouldThrowError = shouldThrow;
  }

  async notify(req: SessionInfoDto, userId: string ,unreadSms: number) {
    if (this.shouldThrowError) {
      throw new PnsPartnerError("Authentication failed with status 401");
    }

    await this.okapiAdapter.getTokenFromOkapi();
  }
}
