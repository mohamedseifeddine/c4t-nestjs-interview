export class UserInfos {
/*
derrière sa liveboxe 0 ou 1   ; 2 une liveboxe, pas la sienne ; 3 pas livebox
user.wassup.sau === 0 || user.wassup.sau === 1

les codes produits :
wassup.spr : window.appConf.user.unlimited
bundles.proUnlimited  =  wassup spr & 64
else
bundles.proLimited
 */
    constructor(
        public readonly wassupSpr: number,
        public readonly wassupSau: number,
        public readonly monthlyQuotaSendSms: number,
        public readonly termsAccepted: boolean,
        public readonly displayTutorial: boolean,
        public readonly pinDefined: boolean,
        public readonly pinLocked: boolean,
        public readonly addSignatureToMessage: boolean,
        public readonly messageSignature: string,
    ) {
    }
}
