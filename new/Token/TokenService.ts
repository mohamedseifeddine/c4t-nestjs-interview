import {UserStoragePort} from "../User/UserStoragePort";
import {WassupAdapterPort} from "../wassup/WassupAdapterPort";
import {WassupUser} from "../wassup/WassupUser";
import {ForbiddenUserContractError} from "./Errors/ForbiddenUserContractError";
import {ForbiddenUserTypeError} from "./Errors/ForbiddenUserTypeError";
import {Token} from "./Token";
import {UserNotFoundInStorageWithIseError} from "../User/Errors/UserNotFoundInStorageWithIseError";
import {User} from "../User/User";
import {SessionInfo} from "../globalMiddlewares/SessionInfo";

export default class TokenService {

    constructor(private wassupAdapter: WassupAdapterPort, private userStorage: UserStoragePort) {
    }

    static status(): string {
        return 'OK';
    }

    async getToken(cookie: string) {
        const wassupUser = await this.wassupAdapter.getUserWithCookie(cookie);
        const user = await this.manageWassupUser(wassupUser);

        await this.checkAndCreatePrimaryAccount(user);

        const token = new Token(SessionInfo.serviceId(), wassupUser.uid);
        return token;
    }

    private async checkAndCreatePrimaryAccount(user: User) {
        if (!user.isPrimaryAccount()) {
            try {
                await this.userStorage.userByIse(user.puid)
            } catch (e: any) {
                if (e instanceof UserNotFoundInStorageWithIseError) {
                    const primaryAccount = await this.wassupAdapter.getUserWithUid(user.puid);
                    await this.manageWassupUser(primaryAccount);
                } else {
                    throw e
                }
            }
        }
    }

    private async manageWassupUser(wassupUser: WassupUser) {
        if (wassupUser.uit !== 1) {
            throw new ForbiddenUserTypeError();
        }
        if (wassupUser.spr < 24) { // if a user has OOPIM and OOMail, we consider him as a pro. otherwise he's forbidden
            throw new ForbiddenUserContractError()
        }
        //TODO pas optimal, a voir pour passer de 3 requetes à une ou deux : create, update, get
        await this.updateUserLastConnectionAndCreateIfNotExist(wassupUser);
        return await this.userStorage.userByIse(wassupUser.uid)
    }

    private async updateUserLastConnectionAndCreateIfNotExist(wassupUser: WassupUser) {
        await this.userStorage.createUserIfNotExist(wassupUser.uid, wassupUser.spr, wassupUser.sau, wassupUser.puid, wassupUser.ulo);
        await this.userStorage.updateLastConnectionDateToNow(wassupUser.uid);
    }
}

