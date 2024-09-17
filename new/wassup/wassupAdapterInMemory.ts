import {WassupAdapterPort} from "./WassupAdapterPort";
import {WassupUser} from "./WassupUser";
import {WassupUnknownUserError} from "./WassupUnknownUserError";


export class WassupUserInMemory{
    constructor(public readonly cookie : string, public readonly wassupUser:WassupUser) {
    }
}
export class WassupAdapterInMemory extends WassupAdapterPort {

    public knowUserByCookie= new Array<WassupUserInMemory>()

    async getUserWithCookie(cookie: string) {
        const user = this.knowUserByCookie.filter(wuim => wuim.cookie === cookie)[0];
        if (user === undefined)
            throw new WassupUnknownUserError();
        return user.wassupUser;
    }

    async getUserWithUid(uid: string): Promise<WassupUser>  {
        const user = this.knowUserByCookie.filter(wuim => wuim.wassupUser.uid === uid)[0];
        if (user === undefined)
            throw new WassupUnknownUserError();
        return user.wassupUser;
    }
}
