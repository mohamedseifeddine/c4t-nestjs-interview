import { MessageConversation } from "../model/messageConversation";
import { MessageFromApiBuilder } from "../model/MessageFromApiBuilder";
import { MessageStored } from "../model/MessageStored";
import { SendingMessageParser } from "./SendingMessageParser";

describe('SendingMessageParser', () => {

    test('Message with deferred date is deferred', () => {
        const message = new MessageFromApiBuilder()
            .withDifferedDate('2212')
            .withDestinationPhoneNumber("+216285754865")
            .build();

        const unitaryMessage = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessage[0].deferred).toEqual(true)
    })

    test('when message with deferred date, status is deferred and reply type is noReply', () => {
        let message = new MessageFromApiBuilder()
            .withDifferedDate('2212')
            .withReplyType('')
            .withDestinationPhoneNumber("+216285754865")
            .build();

        const unitaryMessage = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessage[0].status).toEqual('deferred')
        expect(unitaryMessage[0].replyType).toEqual('noreply')
    })

    test('Message without deferred date is not deferred', () => {
        const message = new MessageFromApiBuilder()
            .withDifferedDate('')
            .withDestinationPhoneNumber("+216285754865")
            .build();

        const unitaryMessage = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessage[0].deferred).toEqual(false)
    })

    test('when message without deferred date, status is sending and reply type is inbox', () => {
        let message = new MessageFromApiBuilder()
            .withDifferedDate('')
            .withReplyType('')
            .withDestinationPhoneNumber("+33640567891")
            .build();

        const unitaryMessage = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessage[0].status).toEqual('sending')
        expect(unitaryMessage[0].replyType).toEqual('inbox')
    })

    test('Take the given reply type when the message has no deferred date and the destination phone number is metropolitain', () => {
        let message = new MessageFromApiBuilder()
            .withDifferedDate('')
            .withReplyType('noreply')
            .withDestinationPhoneNumber("+33640567891")
            .build();

        const unitaryMessage = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessage[0].replyType).toEqual('noreply')
    })

    test('force to noreply when recipient phone number is not metropolitan', () => {
        const message = new MessageFromApiBuilder()
            .withReplyNotification(true)
            .withReplyType('')
            .withDestinationPhoneNumber("+216285754865")
            .build();

        const unitaryMessage = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessage[0].replyNotification).toEqual(false)
        expect(unitaryMessage[0].replyType).toEqual('noreply')
    })


    test('replyNotification at true for a metropolitan number is true in unitaryMessage ', () => {
        let message = new MessageFromApiBuilder()
            .withDifferedDate('')
            .withReplyNotification(true)
            .withDestinationPhoneNumber("+33640567891")
            .build();

        const unitaryMessage = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessage[0].replyNotification).toEqual(true)
    })

    test('replyNotification at false for a metropolitan number is false in unitaryMessage ', () => {
        let message = new MessageFromApiBuilder()
            .withDifferedDate('')
            .withReplyNotification(false)
            .withDestinationPhoneNumber("+33640567891")
            .build();

        const unitaryMessage = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessage[0].replyNotification).toEqual(false)
    })

    test('two recipient in message gave two unitaryMessage', () => {
        let message = new MessageFromApiBuilder()
            .withDifferedDate('')
            .withReplyNotification(false)
            .withDestinationPhoneNumber("+33640567891")
            .withDestinationPhoneNumber("+21653295702")
            .build();

        const unitaryMessages = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessages.length).toEqual(2)
    })

    test('message number is 1 when the content is small and the header size is 0', ()=>{
        const message = new MessageFromApiBuilder()
            .withReplyType('noreply')
            .withHeader('')
            .withContent('a small message')
            .withDestinationPhoneNumber("+216285754865")
            .build();

        const unitaryMessages = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessages[0].messagesNumber).toEqual(1)
    })

    test('message number is 3 when the content is long and the header size is 0', ()=>{
        const message = new MessageFromApiBuilder()
            .withReplyType('noreply')
            .withHeader('')
            .withContent('Embrace the journey, for each step holds the potential for growth and discovery. Life’s beauty lies in its unpredictability, making every moment valuable and unique.Embrace the journey, for each step holds the potential for growth and discovery. Life’s beauty lies in its unpredictability, making every moment valuable and unique.')
            .withDestinationPhoneNumber("+216285754865")
            .build();

        const unitaryMessages = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessages[0].messagesNumber).toEqual(3)
    })

    test('message number is 2 when the content is small and the header is big', ()=>{
        const message = new MessageFromApiBuilder()
            .withReplyType('noreply')
            .withHeader('De: a big header with a lot of useless information like this one and this other and another again, bla bla bli, bla bla bla. hi ho we come from our work, hi ho, ...')
            .withContent('a small message')
            .withDestinationPhoneNumber("+216285754865")
            .build();

        const unitaryMessages = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessages[0].messagesNumber).toEqual(2)
    })

    test('message number is 2 when the content is medium and the header size is 0 and the reply type is inbox (it\'s add a footer)', ()=>{
        const message = new MessageFromApiBuilder()
            .withReplyType('inbox')
            .withHeader('')
            .withContent('a medium message with just the max number of caractere for one message number and that it. so now I complete the message with bla bla or with some lorem ipsum')
            .withDestinationPhoneNumber("+33640567891")
            .build();

        const unitaryMessages = SendingMessageParser.toMessageToSend(message)

        expect(unitaryMessages[0].messagesNumber).toEqual(2)
    })
    test('map MessageStored to messageConversation correctly', () => {
        const messageStored = new MessageStored(
            "+21629690080",
            "user",
            false,
            "2023-12-06T15:15:00.163Z",
            false,
            "",
            "outbox",
            7,
            1,
            1,
            "sent",
            "",
            "noreply",
            false,
            "Bonjour",
            "",
            "hubMessageId",
            false,
            new Date("2023-12-06T15:15:00.163Z"),
            new Date("2023-12-06T15:15:00.314Z"),
            new Date("2023-12-06T15:15:00.314Z"),
            "65708ff4fcf4440231d5bcf1",
            false
        );

        const result = SendingMessageParser.mapMessageStoredToConversation(messageStored);

        expect(result).toBeInstanceOf(MessageConversation);
        expect(result.id).toBe(messageStored.id);
        expect(result.box).toBe(messageStored.box);
        expect(result.size).toBe(messageStored.size);
        expect(result.messagesNumber).toBe(1);
        expect(result.status).toBe(messageStored.status);
        expect(result.read).toBe(messageStored.read);
        expect(result.errorCode).toBe(messageStored.errorCode);
        expect(result.billed).toBe(false);
        expect(result.billingType).toBe("");
        expect(result.recipient).toBe(messageStored.recipient);
        expect(result.subject).toBe(messageStored.subject);
        expect(result.deferred).toBe(messageStored.deferred);
        expect(result.deferredAck).toBe(messageStored.deferredAck);
        expect(result.replyType).toBe(messageStored.replyType);
        expect(result.replyNotification).toBe(messageStored.replyNotification);
        expect(result.sendingDate).toEqual(messageStored.sendingDate);
        expect(result.messageType).toBe("sms");
        expect(result.content).toBe(messageStored.content);
        expect(result.ctime).toEqual(messageStored.ctime);
        expect(result.mtime).toEqual(messageStored.mtime);
        expect(result.attachments).toEqual([]);
    });
})
