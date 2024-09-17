import { PhoneNumberService } from "./PhoneNumberService"

describe('PhoneNumberService', ()=>{
    test('is internationnal phone number', () => {

        const isMetropolitan = PhoneNumberService.isMetropolitanFrenchNumber('+33693834322')

        expect(isMetropolitan).toEqual(false)
    })

    test('is metropolitan phone number', () => {

        const isMetropolitan = PhoneNumberService.isMetropolitanFrenchNumber('+33607693800')

        expect(isMetropolitan).toEqual(true)
    })
})
