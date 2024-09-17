import {UserStorageInMemory} from "./storageAdapter/UserStorageInMemory";

export class SetUpUserForTest {

    static async createUserInStorage(userStorage: UserStorageInMemory, uid: string, puid: string, spr = 64, sau=1, ulo = 'machin@bidule.com') {
        await userStorage.createUserIfNotExist(uid, spr, sau, puid, ulo)
        return await userStorage.userByIse(uid)
    }
    static async createUserAndPrimaryInStorage(userStorage: UserStorageInMemory, uid: string, puid: string, spr = 64, sau=1, ulo = 'machin@bidule.com') {
        await userStorage.createUserIfNotExist(uid, spr, sau, puid, ulo)
        await userStorage.createUserIfNotExist(puid, spr, sau, puid, ulo)
        return await userStorage.userByIse(uid)
    }
}
