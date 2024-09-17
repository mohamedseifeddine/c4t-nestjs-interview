export class PaddockNoContentError extends Error {
    constructor() {
        super('You must set the content of the SMS to send')
    }
}