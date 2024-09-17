import { EncryptedToken } from "../Token/EncryptedToken";
import { CryptoService } from "../crypto/CryptoService";
import { QuotaService } from "../quota/QuotaService";
import { BadUserIdError } from "./Errors/BadUserIdError";
import { ForbiddenSauError } from "./Errors/ForbiddenSauError";
import { MessageSignature } from "./MessageSignature";
import { UserInfos } from "./UserInfos";
import { UserStoragePort } from "./UserStoragePort";
import {User} from "./User";

export class UserService {

    constructor(public readonly userStorage: UserStoragePort,
                public readonly quotaService: QuotaService) {

    }

    async userInfosByUid(uid: string) {
        const user = await this.userStorage.userByIse(uid)
        const sentSmsMonthly = (await this.quotaService.sentSms(user)).monthly;

        const sau = this.overrideSau(user)

        return new UserInfos(
            user.spr,
            sau,
            sentSmsMonthly,
            user.termsAccepted,
            user.displayTutorial,
            Boolean(user.pinCode),
            user.pinLocked,
            user.addSignatureToMessage,
            user.messageSignature
        )
    }

    async userInfos(encryptedToken: EncryptedToken, userId: string) {
        this.checkUserId(userId);
        return this.userInfosByUid(encryptedToken.uid())
    }

    async markTermsAccepted(encryptedToken: EncryptedToken, userId: string) {
        this.checkUserId(userId);
        await this.userStorage.updateTermsAcceptedToTrue(encryptedToken.uid())
        await this.updateLastActivityDateToNow(encryptedToken)
    }

    async hideTutorial(encryptedToken: EncryptedToken, userId: string) {
        this.checkUserId(userId);
        await this.userStorage.updateDisplayTutorialToFalse(encryptedToken.uid())
        await this.updateLastActivityDateToNow(encryptedToken)
    }

    async updateMessageSignature(encryptedToken: EncryptedToken, userId: string, messageSignature: MessageSignature) {
        this.checkUserId(userId);
        await this.userStorage.updateMessageSignature(encryptedToken.uid(), messageSignature)
        await this.updateLastActivityDateToNow(encryptedToken)
    }

    async updatePinCode(encryptedToken: EncryptedToken, userId: string, pincode: string) {
        this.checkUserId(userId);
        await this.isBehindBox(encryptedToken)
        await this.userStorage.updatePinCode(encryptedToken.uid(), CryptoService.hashValue(pincode))
        await this.updateLastActivityDateToNow(encryptedToken)

    }

    private checkUserId(userId: string) {
        if (userId !== 'me') {
            throw new BadUserIdError();
        }
    }

    async updateLastActivityDateToNow(encryptedToken: EncryptedToken) {
        await this.userStorage.updateLastActivityDateToNow(encryptedToken.uid())
    }

    async isBehindBox(encryptedToken: EncryptedToken) {
        const user = await this.userStorage.userByIse(encryptedToken.uid())

        if (user.sau > 1) {
            throw new ForbiddenSauError();
        }
    }

    async updateLastActivityDateToNowByUserId(ise: string) {
        await this.userStorage.updateLastActivityDateToNow(ise)
    }

    private overrideSau(user: User) {
        if(user.wassupOverrideSau !== undefined && user.wassupOverrideSau>=0){
            return user.wassupOverrideSau
        }
        return user.sau
    }
}
