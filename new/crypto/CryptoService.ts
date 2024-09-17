// Algorithm to use to cipher messages
import crypto from "crypto";

// const CRYPTO_ALGO_LOCAL = CryptoConfig.cryptoAlgo || 'aes-256-gcm'
const CRYPTO_ALGO_LOCAL = 'aes-256-gcm'
// Key used to cipher messages
const CRYPTO_KEY_LOCAL = '20a67888da4d03a3646925f1a8fedf3a'

// rec preprod : CRYPTO_KEY=VAULT


export class CryptoService {

    static encryptValue(clearValue: string) {
        const key = CRYPTO_KEY_LOCAL;
        const algo = CRYPTO_ALGO_LOCAL;

        // NIST recommends an Initialization Vector of 12 bytes. The IV must be unpredictable (hence the randomBytes)
        // but doesn't need to be secret, and it is required to decipher the message. So it's passed along with the msg
        const iv = crypto.randomBytes(12).toString('hex');

        const cipher = crypto.createCipheriv(algo, key, iv, );
        let encryptedData = cipher.update(clearValue, 'utf8', 'hex');

        encryptedData += cipher.final('hex');

        return iv + cipher.getAuthTag().toString('hex') + encryptedData;
    }

    static decryptValue(input: string) {

        const key = CRYPTO_KEY_LOCAL;
        const algo = CRYPTO_ALGO_LOCAL;

        // Slice at 24 chars as the IV was 12 bytes hexadecimal encoded, so 24 chars. The original IV, used to cipher
        // the message, is required to decipher it.
        // Another slice between 24 and 56 to retrieve the 16 bytes auth tag, or 32 hex char
        const iv = input.slice(0, 24);
        const authTag = input.slice(24, 56);
        const encryptedData = input.slice(56);

        const decipher = crypto.createDecipheriv(algo, key, iv, {authTagLength: 16});
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');

        decryptedData += decipher.final('utf8');

        return decryptedData;
    }


    static hashValue(value: string) {
        const hash = crypto.createHash('sha512');
        const salt = crypto.randomBytes(10)
            .toString('hex')
            .substring(0, 10);

        hash.update(salt + value);

        return salt + hash.digest('hex');
    }

    static checkValueAgainstHash(refHash: string, clearValue: string) {
        const hash = crypto.createHash('sha512');
        const salt = refHash.substring(0, 10);
        const saltedHash = refHash.substring(10);

        hash.update(salt + clearValue);

        return hash.digest('hex') === saltedHash;
    }
}
