import {OdiInvalidClientError} from "../../Errors/OdiInvalidClientError";
import {PaddockBadFormatPhoneNumberError} from "../../Errors/PaddockBadFormatPhoneNumberError";
import {PaddockPartnerError} from "../../Errors/PaddockPartnerError";
import {ShortCodeReplyable} from "../../domain/model/ShortCodeReplyable";
import {PaddockAdapterPort} from "../../domain/port/PaddockAdapterPort";
import {PaddockAdapter} from "./PaddockAdapter";
import {PaddockAdapterInMemory} from "./PaddockAdapterInMemory";

describe.each([
    [new PaddockAdapter()],
    [new PaddockAdapterInMemory()],
])(`PaddockAdapter :%s`, (paddockAdapter: PaddockAdapterPort) => {

    test('send sms succed', async () => {

        const res = await paddockAdapter.sendSMS(new ShortCodeReplyable(
                'sender',
                ['20967'],
                'Basic MWd0Zzh2MkJCM2lVdG1jRnJ3Qmh3UlZCUEprRElFemk6NGZGV2lYbUF1YUNVeDRsTA=='),
            'Hello - test auto webxmsapi',
            '+33607693800');

        // sendSms return sample : 5cbc365e-624d-4553-ae5c-136b033d9883
        expect(res).toBeDefined();
    })

    test('send sms without phone number return PaddockBadFormatPhoneNumberError', async () => {
        try {
            await paddockAdapter.sendSMS(new ShortCodeReplyable(
                    'sender',
                    ['20967'],
                    'Basic MWd0Zzh2MkJCM2lVdG1jRnJ3Qmh3UlZCUEprRElFemk6NGZGV2lYbUF1YUNVeDRsTA=='),
                'Hello - test auto webxmsapi',
                '');
            fail('should fail with PaddockBadFormatPhoneNumberError')
        } catch (e: any) {
            expect(e).toEqual(new PaddockBadFormatPhoneNumberError(''))
        }
    })

    test('send sms without country prefix phone number return PaddockBadFormatPhoneNumberError', async () => {
        try {
            await paddockAdapter.sendSMS(new ShortCodeReplyable(
                'sender',
                ['20967'],
                'Basic MWd0Zzh2MkJCM2lVdG1jRnJ3Qmh3UlZCUEprRElFemk6NGZGV2lYbUF1YUNVeDRsTA==',
            ), 'Hello - test auto webxmsapi', '0607693800');
            fail('should fail with PaddockBadFormatPhoneNumberError')
        } catch (e: any) {
            expect(e).toEqual(new PaddockBadFormatPhoneNumberError('0607693800'))
        }
    })

    test.skip('send sms with too long phone number throw PaddockPartnerError', async () => {
        try {
            await paddockAdapter.sendSMS(new ShortCodeReplyable(
                'sender',
                ['20967'],
                'Basic MWd0Zzh2MkJCM2lVdG1jRnJ3Qmh3UlZCUEprRElFemk6NGZGV2lYbUF1YUNVeDRsTA==',
            ), 'Hello - test auto webxmsapi', '+3360769380000000');
            fail('should fail with PaddockPartnerError')
        } catch (e: any) {
            expect(e).toEqual(new PaddockPartnerError('Request failed with status code 400'))
        }
    })

    test.skip('send sms fail with OdiInvalidClientError when odiAuthorization is wrong', async () => {
        try {
            await paddockAdapter.sendSMS(new ShortCodeReplyable(
                'sender',
                ['20967'],
                'Basic MWdddzazd6NGZGV2lYbUF1YUNVeDRsTA==',
            ), 'Hello - test auto webxmsapi', '+33607693800');
            fail('should fail with PaddockPartnerError')
        } catch (e: any) {
            expect(e).toEqual(new OdiInvalidClientError())
        }

    })


})
