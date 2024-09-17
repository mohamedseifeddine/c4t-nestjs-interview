import {MessageSignature} from "./MessageSignature";
import {User} from "./User";

export abstract class UserStoragePort {
    abstract createUserIfNotExist(ise: string, spr: number, sau: number, puid: string, ulo: string): Promise<void>;

    abstract userByIse(ise: string): Promise<User>;

    abstract userById(userId: string): Promise<User>;

    abstract updateLastConnectionDateToNow(ise: string): Promise<void>

    abstract updateLastActivityDateToNow(ise: string): Promise<void>

    abstract flagAsDeleted(ise: string): Promise<void>

    abstract updateTermsAcceptedToTrue(ise: string): Promise<void>

    abstract updateDisplayTutorialToFalse(ise: string): Promise<void>

    abstract updateMessageSignature(ise: string, messageSignature: MessageSignature): Promise<void>

    abstract updatePinCode(ise: string, pincode: string): Promise<void>

    abstract blockPinForTest(ise: string): Promise<void>

    abstract overrideWassupSau(id: string, number: number): Promise<void>
}
