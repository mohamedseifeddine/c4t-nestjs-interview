import {WassupUser} from "./WassupUser";

export abstract class WassupAdapterPort {
    async getUserWithCookie(cookie: string): Promise<WassupUser> {
        throw new Error("Must be implemented")
    }

    async getUserWithUid(uid: string): Promise<WassupUser> {
        throw new Error("Must be implemented")
    }

}
