import { OkapiAdapterPort } from "./OkapiAdapterPort";

export class OkapiAdapterInMemory implements OkapiAdapterPort {
  private _throwError: boolean = false;

  set throwError(throwError: boolean) {
    this._throwError = throwError;
  }

  async getTokenFromOkapi(): Promise<string> {
    if (this._throwError) {
      return Promise.reject(new Error('Authentication failed with status 401'));
    }
    return Promise.resolve("test_token");
  }
}
