export class PaddockBadFormatPhoneNumberError extends Error {
    constructor(phoneNumber: string) {
        super(`The format of the recipient :${phoneNumber}, is not correct. The recipient must be formatted as : +33600000001`)
    }
}
