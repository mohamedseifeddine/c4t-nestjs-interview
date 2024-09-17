import { CryptoService } from "../crypto/CryptoService";
import { DateSimulator } from "../date-provider/DateSimulator";
import { EncryptedToken } from "./EncryptedToken";
import { BadTokenFormatError } from "./Errors/BadTokenFormatError";
import { ExpiredTokenError } from "./Errors/ExpiredTokenError";
import { TokenServiceIdMismatchError } from "./Errors/TokenServiceIdMismatchError";
import { Token } from "./Token";


describe('EncryptedToken', () => {
    let dateSimulator = new DateSimulator();

    beforeEach(async () => {
        dateSimulator = new DateSimulator();
    })
    afterEach(async () => {
        dateSimulator.restore()
    })

    test('extract uid from encrypted token', () => {
        dateSimulator?.dateIs('2024-02-12T14:55:46.623Z')
        const token = new Token('aServiceId', 'auid')
        const encryptedToken = new EncryptedToken(token.encryptedValue(), 'aServiceId');

        const uid = encryptedToken.uid();

        expect(uid).toEqual('auid');
    })

    test('throw BadTokenFormatError when encrypted token is formated without all information', () => {
        const encryptedToken = new EncryptedToken(
            CryptoService.encryptValue('aServiceId|aUid without last pipe and date'),
            'aServiceId'
        );
        try {
            encryptedToken.uid()
        } catch (e) {
            expect(e).toEqual(new BadTokenFormatError());
        }
    })

    test('throw BadTokenFormatError when encrypted token is miss crypted', () => {
        const encryptedToken = new EncryptedToken('aMissCryptedValue', 'aServiceId');
        try {
            encryptedToken.uid()
        } catch (e) {
            expect(e).toEqual(new BadTokenFormatError());
        }
    })

    test('throw ExpiredTokenError when encrypted token expiration date is over', () => {
        dateSimulator?.dateIs('2024-02-12T14:55:46.623Z')
        const token = new Token('aServiceId', 'auid')
        const encryptedToken = new EncryptedToken(token.encryptedValue(), 'aServiceId');

        dateSimulator?.dateIs('2025-02-12T14:55:46.623Z')
        try {
            encryptedToken.uid()
        } catch (e) {
            expect(e).toEqual(new ExpiredTokenError());
        }
    })

    test('throw TokenServiceIdMismatchError when encrypted token serviceId is different from session serviceId', () => {
        dateSimulator?.dateIs('2024-02-12T14:55:46.623Z')
        const token = new Token('aServiceId', 'auid')
        const encryptedToken = new EncryptedToken(token.encryptedValue(), 'anotherServiceId');

        try {
            encryptedToken.uid()
            fail('should fail with TokenServiceIdMismatchError')
        } catch (e) {
            expect(e).toEqual(new TokenServiceIdMismatchError());
        }
    })

})
