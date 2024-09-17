export class User {
    /*
            public readonly monthlyQuotaSendSms: number, // dans une autre collection MonthlyQuotaModel
            public readonly displayTutorial: boolean, // default true
            */

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
        public readonly ise: string,
        public spr: number,
        public sau: number,
        public ulo: string,
        public readonly puid: string,
        public wassupOverrideSau: number,
        public pinCode: string,
        public pinLocked: boolean,
        public pinTries: number,
        public addSignatureToMessage: boolean,
        public messageSignature: string,
        public termsAccepted: boolean,
        public displayTutorial: boolean,
        public firstConnectionDate: Date,
        public lastConnectionDate: Date,
        public lastActivityDate: Date,
        public id: string,
    ) {
    }

    isPrimaryAccount() {
        //isMasterAccount
        return !this.puid || this.puid === this.ise;
    }

    hasUnlimitedOption() {
        // le bit pour l'option unlimited : 6
        return Boolean(this.spr & 64);
    }
}
