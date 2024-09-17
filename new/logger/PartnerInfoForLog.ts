export class PartnerInfoForLog {
    constructor(public readonly partnerId: string) {
    }

    onBeforeCall() {
        return {}
    }

    onAfterCall() {
        return {}
    }

    onErrorCall() {
        return {}
    }
}
