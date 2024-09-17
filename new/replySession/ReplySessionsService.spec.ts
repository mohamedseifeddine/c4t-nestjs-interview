import { ShortCodeConfig } from '../message/adapters/ShortCodeConfigBuilder';
import { ShortCodeInternational } from '../message/domain/model/ShortCodeInternational';
import { ShortCodeNoReply } from '../message/domain/model/ShortCodeNoReply';
import { ShortCodeReplyable } from '../message/domain/model/ShortCodeReplyable';
import { ReplySessionsService } from './ReplySessionsService';
import { ReplySessionStorageInMemory } from './storageAdapter/ReplySessionStorageInMemory';

describe('ReplySessionsService', () => {
    const shortCodeConfig = new ShortCodeConfig(
        new ShortCodeNoReply("aNoReplySenderadress", ["10000"], "noReplyOdiAuthorization"), 
        new ShortCodeInternational("aInterSenderadress", ["20000"], "interOdiAuthorization"), 
        [
            new ShortCodeReplyable("aReplyableSenderadress0", ["30000"], "ReplyableOdiAuthorization0"),
            new ShortCodeReplyable("aReplyableSenderadress1", ["30001"], "ReplyableOdiAuthorization1"),
        ]
    )
    let service: ReplySessionsService;
    let replySessionsStorage: ReplySessionStorageInMemory

    beforeEach(() => {
        replySessionsStorage = new ReplySessionStorageInMemory()
        service = new ReplySessionsService(shortCodeConfig,replySessionsStorage);
    });

    test('find VirtualShortCode by senderAddress', async () => {
        const vsc = await service.getVirtualShortCodeById('aNoReplySenderadress');
        
        expect(vsc).toEqual({
            senderAddress: 'aNoReplySenderadress',
            virtualShortCode: ["10000"],
            odiAuthorization: "noReplyOdiAuthorization"
        });
    });

    test('return undefined if VirtualShortCode by senderAddress not found', async () => {
        const vsc = await service.getVirtualShortCodeById('nonExistentAddress');
        expect(vsc).toBeUndefined();
    });

    test('find VirtualShortCode by shortCode', async () => {
        const vsc = await service.getVirtualShortCodeBySC('10000');
        expect(vsc).toEqual({
            senderAddress: 'aNoReplySenderadress',
            virtualShortCode: ["10000"],
            odiAuthorization: "noReplyOdiAuthorization"
        });
    });

    test('return undefined if VirtualShortCode by shortCode not found', async () => {
        const vsc = await service.getVirtualShortCodeBySC('nonExistentShortCode');
        expect(vsc).toBeUndefined();
    });
});
