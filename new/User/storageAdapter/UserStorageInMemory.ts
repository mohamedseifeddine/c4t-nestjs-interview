import { v4 as uuidv4 } from "uuid";
import { DateProvider } from "../../date-provider/DateProvider";
import { UserCreationError } from "../Errors/UserCreationError";
import { UserNotFoundInStorageWithIseError } from "../Errors/UserNotFoundInStorageWithIseError";
import { MessageSignature } from "../MessageSignature";
import { UserStoragePort } from "../UserStoragePort";
import { User } from "../User";
import {UserNotFoundInStorageWithUserIdError} from "../Errors/UserNotFoundInStorageWithUserIdError";

class UserStoredInMemory {
    public deleted = false

    constructor(public readonly userStored: User) {
    }
}

export class UserStorageInMemory extends UserStoragePort {
    public userInMemory: Array<UserStoredInMemory> = new Array<UserStoredInMemory>();
    private error: Error | undefined;
    public nextId = uuidv4


    async createUserIfNotExist(ise: string, spr: number, sau: number, puid: string, ulo: string): Promise<void> {
        if (this.error) {
            throw this.error;
        }
        const user = this.userInMemory.filter(u => u.userStored.ise === ise)[0]
        if(user){
            user.userStored.spr = spr
            user.userStored.sau = sau
            user.userStored.ulo = ulo
            return
        }
        try {
            const firstConnectionDate = DateProvider.now();
            const newUserStored = new User(
                ise,
                spr,
                sau,
                ulo,
                puid,
                -1,
                '',
                false,
                0,
                false,
                '',
                false,
                true,
                firstConnectionDate,
                firstConnectionDate,
                firstConnectionDate,
                this.nextId())
            this.userInMemory.push(new UserStoredInMemory(newUserStored));
        } catch (error: any) {
            throw new UserCreationError(error.message);
        }
    }

    async flagAsDeleted(ise: string) {
        const user = this.userInMemory.filter(u => u.userStored.ise === ise)[0];
        user!.deleted = true
        return
    }

    async userByIse(ise: string) {
        if (this.error) {
            throw this.error;
        }
        const user = this.userInMemory.filter(u => u.userStored.ise === ise)[0];
        if (user === undefined || user.deleted) {
            throw new UserNotFoundInStorageWithIseError(ise);
        }
        return user.userStored;
    }

    async userById(userId: string) {
        if (this.error) {
            throw this.error;
        }
        const user = this.userInMemory.filter(u => u.userStored.id === userId)[0];
        if (user === undefined || user.deleted) {
            throw new UserNotFoundInStorageWithUserIdError(userId);
        }
        return user.userStored;
    }

    async updateLastConnectionDateToNow(ise: string) {
        const user = await this.userByIse(ise);
        if (user) {
            user.lastConnectionDate = DateProvider.now();
        } else {
            throw new UserNotFoundInStorageWithIseError(ise);
        }
    }

    async updateLastActivityDateToNow(ise: string) {
        const user = await this.userByIse(ise);
        if (user) {
            user.lastActivityDate = DateProvider.now();
        } else {
            throw new UserNotFoundInStorageWithIseError(ise);
        }
    }

    async updateTermsAcceptedToTrue(ise: string) {
        const user = await this.userByIse(ise);
        if (user) {
            user.termsAccepted = true;
        } else {
            throw new UserNotFoundInStorageWithIseError(ise);
        }
    }

    async updateDisplayTutorialToFalse(ise: string) {
        const user = await this.userByIse(ise);
        if (user) {
            user.displayTutorial = false;
        } else {
            throw new UserNotFoundInStorageWithIseError(ise);
        }
    }

    async updateMessageSignature(ise: string, messageSignature: MessageSignature) {
        const user = await this.userByIse(ise);
        if (user) {
            user.addSignatureToMessage = messageSignature.addSignatureToMessage;
            user.messageSignature = messageSignature.messageSignature;
        } else {
            throw new UserNotFoundInStorageWithIseError(ise);
        }
    }

    async updatePinCode(ise: string, pincode: string): Promise<void> {
        const user = await this.userByIse(ise);
        if (user) {
            user.pinCode = pincode;
            user.pinTries = 0;
            user.pinLocked = false;
        } else {
            throw new UserNotFoundInStorageWithIseError(ise);
        }
    }

    failWithError(error: Error) {
        this.error = error;
    }

    removeError() {
        this.error = undefined;
    }

    async blockPinForTest(ise: string): Promise<void> {
        const user = await this.userByIse(ise);
        if (user) {
            user.pinTries = 3;
            user.pinLocked = true;
        } else {
            throw new UserNotFoundInStorageWithIseError(ise);
        }
    }


    async overrideWassupSau(id: string, sau: number): Promise<void>{
        const user = this.userInMemory.filter(u => u.userStored.id === id)[0]
        user.userStored.wassupOverrideSau = sau;
    }
}
