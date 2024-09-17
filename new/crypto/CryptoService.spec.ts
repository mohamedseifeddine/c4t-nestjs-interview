import {CryptoService} from "./CryptoService";

describe('cryptoService', ()=>{
    test('encrypt and decrypt value', ()=>{
        const value = 'aValue'

        const encryptedValue = CryptoService.encryptValue(value);

        expect(CryptoService.decryptValue(encryptedValue)).toEqual(value)
    })


    test('hash value and check Value Against Hash', ()=>{
        const value = 'aValue'

        const hashedValue = CryptoService.hashValue(value);

        expect(CryptoService.checkValueAgainstHash(hashedValue, value)).toEqual(true)
    })
})
