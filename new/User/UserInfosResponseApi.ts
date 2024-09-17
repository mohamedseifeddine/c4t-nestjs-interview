export class UserInfosResponseApi {
    private wassup: { spr: number; sau: number; pro: boolean; userType: string };
    private monthlyQuota: { sentSms: number };

    constructor(
        wassupSpr: number,
        wassupSau: number,
        monthlyQuotaSendSms: number,
        public readonly termsAccepted: boolean,
        public readonly displayTutorial: boolean,
        public readonly pinDefined: boolean,
        public readonly pinLocked: boolean,
        public readonly addSignatureToMessage: boolean,
        public readonly messageSignature: string,
    ) {
        this.wassup = {
            spr: wassupSpr,
            sau: wassupSau,
            pro: true,
            userType: "I"
        }
        this.monthlyQuota = {
            sentSms: monthlyQuotaSendSms
        }
    }
}
