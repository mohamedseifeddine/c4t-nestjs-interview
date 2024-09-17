export abstract class ShortCode {
    public abstract readonly senderAddress: string // ==> virtualShortCodeId
    public abstract readonly virtualShortCode : Array<string>
    public abstract readonly odiAuthorization: string


}
