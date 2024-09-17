import mongoose from "mongoose";
import {DateProvider} from "../../date-provider/DateProvider";
import {UserCreationError} from "../Errors/UserCreationError";
import {UserNotFoundInStorageWithIseError} from "../Errors/UserNotFoundInStorageWithIseError";
import {MessageSignature} from "../MessageSignature";
import {UserStoragePort} from "../UserStoragePort";
import {User} from "../User";
import {MongoModelWithLog} from "../../storage/MongoModelWithLog";
import {MongoClientWithLog} from "../../storage/MongoClientWithLog";
import {UserNotFoundInStorageWithUserIdError} from "../Errors/UserNotFoundInStorageWithUserIdError";

export default class UserStorage extends UserStoragePort {
    userModel: MongoModelWithLog

    constructor(mongoClient: MongoClientWithLog) {
        super();
        this.userModel = mongoClient.model('users',
            new mongoose.Schema({
                ise: String,
                firstConnectionDate: Date,
                lastConnectionDate: Date,
                lastActivityDate: Date,
                wassup: {
                    spr: Number,
                    sau: Number,
                    puid: String,
                    ulo: String
                },
                wassupOverride: {
                    sau: Number
                },
                pinCode: String,
                pinLocked: Boolean,
                pinTries: Number,
                monthlyQuotaSendSms: Number,
                addSignatureToMessage: Boolean,
                messageSignature: String,
                termsAccepted: Boolean,
                displayTutorial: Boolean,
                deleted: Boolean
            }))
    }

    async flagAsDeleted(ise: string) {
        await this.userModel.updateOne(
            {
                ise: ise
            },
            {
                deleted: true
            }
        )
    }

    async createUserIfNotExist(ise: string, spr: number, sau: number, puid: string, ulo: string): Promise<void> {
        try {
            await this.userModel.updateOne(
                {
                    ise: ise
                },
                {
                    $setOnInsert: {
                        ise: ise,
                        firstConnectionDate: DateProvider.now(),
                        lastConnectionDate: DateProvider.now(),
                        lastActivityDate: DateProvider.now(),
                        pinCode: '',
                        pinLocked: false,
                        pinTries: 0,
                        monthlyQuotaSendSms: 0,
                        addSignatureToMessage: false,
                        messageSignature: '',
                        termsAccepted: false,
                        displayTutorial: true,
                        deleted: false,
                        wassupOverride: {
                            sau: -1
                        }
                    },
                    $set: {
                        wassup: {
                            spr: spr,
                            sau: sau,
                            puid: puid,
                            ulo: ulo
                        }
                    }
                },
                {upsert: true}
            );
        } catch (error: any) {
            throw new UserCreationError(error.message);
        }
    }

    async userByIse(ise: string): Promise<User> {
        const findUserModel = await this.userModel.findOne({ise: ise, deleted: false});
        this.checkUserFound(findUserModel, ise);
        return this.mapToUser(findUserModel);
    }


    async userById(userId: string) {
        const findUser = await this.userModel.findOne({_id: userId, deleted: false});
        if (findUser === null) {
            throw new UserNotFoundInStorageWithUserIdError(userId);
        }
        return this.mapToUser(findUser);
    }

    async updateLastConnectionDateToNow(ise: string): Promise<void> {
        const result = await this.userModel.findOneAndUpdate(
            {ise: ise},
            {
                lastConnectionDate: DateProvider.now()
            }
        );
        this.checkUserFound(result, ise);
    }

    async updateLastActivityDateToNow(ise: string): Promise<void> {
        const result = await this.userModel.findOneAndUpdate(
            {ise: ise},
            {
                lastActivityDate: DateProvider.now()
            }
        );
        this.checkUserFound(result, ise);
    }

    async updateTermsAcceptedToTrue(ise: string): Promise<void> {
        const result = await this.userModel.findOneAndUpdate(
            {ise: ise},
            {
                termsAccepted: true
            }
        );
        this.checkUserFound(result, ise);
    }

    async updateDisplayTutorialToFalse(ise: string): Promise<void> {
        const result = await this.userModel.findOneAndUpdate(
            {ise: ise},
            {
                displayTutorial: false
            }
        );
        this.checkUserFound(result, ise);
    }

    async updateMessageSignature(ise: string, messageSignature: MessageSignature): Promise<void> {
        const result = await this.userModel.findOneAndUpdate(
            {ise: ise},
            {
                addSignatureToMessage: messageSignature.addSignatureToMessage,
                messageSignature: messageSignature.messageSignature
            }
        );
        this.checkUserFound(result, ise);
    }

    async overrideWassupSau(userid: string, sau: number): Promise<void> {
        await this.userModel.findOneAndUpdate(
            {_id: userid},
            {
                wassupOverride: {
                    sau: sau
                }
            }
        );
    }

    async updatePinCode(ise: string, pincode: string): Promise<void> {
        const result = await this.userModel.findOneAndUpdate(
            {ise: ise},
            {
                pinCode: pincode,
                pinTries: 0,
                pinLocked: false
            }
        );
        this.checkUserFound(result, ise);
    }

    async blockPinForTest(ise: string): Promise<void> {
        const result = await this.userModel.findOneAndUpdate(
            {ise: ise},
            {
                pinTries: 3,
                pinLocked: true
            }
        );
        this.checkUserFound(result, ise);
    }

    private checkUserFound(result: any, ise: string) {
        if (result === null) {
            throw new UserNotFoundInStorageWithIseError(ise);
        }
    }

    private mapToUser(findUserModel: any) {
        return new User(
            findUserModel.ise,
            findUserModel.wassup.spr,
            findUserModel.wassup.sau,
            findUserModel.wassup.ulo,
            findUserModel.wassup.puid,
            findUserModel.wassupOverride.sau,
            findUserModel.pinCode,
            findUserModel.pinLocked,
            findUserModel.pinTries,
            findUserModel.addSignatureToMessage,
            findUserModel.messageSignature,
            findUserModel.termsAccepted,
            findUserModel.displayTutorial,
            findUserModel.firstConnectionDate,
            findUserModel.lastConnectionDate,
            findUserModel.lastActivityDate,
            findUserModel.id
        );
    }
}
