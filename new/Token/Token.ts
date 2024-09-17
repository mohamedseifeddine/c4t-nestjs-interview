import moment from "moment";
import { CryptoService } from "../crypto/CryptoService";
import { DateProvider } from "../date-provider/DateProvider";

export class Token {
    public readonly expiration;
    private readonly tokenLifeTime = 31536000;

    constructor(public readonly serviceId: string, public readonly uid: string, public readonly creationDate = DateProvider.now()) {

        this.expiration = moment(this.creationDate)
            .add(this.tokenLifeTime, 'seconds')
            .toDate();
    }

    private getValue() {
        return `${this.serviceId}|${this.uid}|${this.creationDate.toISOString()}`;
    }

    encryptedValue() {
        return CryptoService.encryptValue(this.getValue());
    }

    isExpired() {
        const now = DateProvider.now();
        return now > this.expiration;
    }
}
