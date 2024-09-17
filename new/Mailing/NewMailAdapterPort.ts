import { User } from "../User/User";

export interface MailAdapterPort {
    depositMessage(user: User, mail: string, options?: Record<string, unknown>): Promise<void>;
}
