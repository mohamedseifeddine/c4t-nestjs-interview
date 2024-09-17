import { CryptoService } from "../crypto/CryptoService";
import { DateSimulator } from "../date-provider/DateSimulator";
import { Token } from "./Token";

let dateSimulator = new DateSimulator();
describe('getTokenValue', () => {
    beforeEach(async () => {
        dateSimulator = new DateSimulator();
    })
    afterEach(async () => {
        dateSimulator.restore()
    })

    test('get the encrypted token value', () => {
        const currentDate = '2024-02-12T14:55:46.623Z';
        dateSimulator?.dateIs(currentDate)
        const token = new Token('aserviceId', 'auid')

        expect(token.encryptedValue().length).toEqual(136)
        expect(CryptoService.decryptValue(token.encryptedValue())).toEqual(`aserviceId|auid|${currentDate}`)
    })

    test('token is expired when the current date is one year older from the token creation date', ()=>{
        dateSimulator?.dateIs('2024-02-12T14:55:46.623Z');
        const token = new Token('aserviceId', 'auid');

        dateSimulator?.dateIs('2025-02-12T14:55:46.623Z');
        const isExpired = token.isExpired();

        expect(isExpired).toEqual(true);
    })

    test('token is not expired when the current date is les than one year older from the token creation date', ()=>{
        dateSimulator?.dateIs('2024-02-12T14:55:46.623Z');
        const token = new Token('aserviceId', 'auid');

        dateSimulator?.dateIs('2025-02-11T14:53:46.623Z');
        const isExpired = token.isExpired();

        expect(isExpired).toEqual(false);
    })
})
