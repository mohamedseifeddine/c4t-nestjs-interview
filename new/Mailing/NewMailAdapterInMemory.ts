import { MailAdapterPort } from "./NewMailAdapterPort";
import { User } from "../User/User";
import { MailApiError } from "./Errors/MailApiError";

export class NewMailAdapterInMemory implements MailAdapterPort {
  private _throwError: boolean = false;

  set throwError(throwError: boolean) {
    this._throwError = throwError;
  }

  async depositMessage(
    user: User,
    mail: string,
    options: Record<string, unknown> | null = null
  ): Promise<void> {
    
    if (this._throwError) {
      throw new MailApiError('Error depositing message', 500);
    }
  }
}
