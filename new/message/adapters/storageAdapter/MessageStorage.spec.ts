import { randomUUID } from "crypto";
import { DateSimulator } from "../../../date-provider/DateSimulator";
import { objectStoredJestMatcher } from "../../../ObjectStoredJestMatcher";
import { MongoClientWithLog } from "../../../storage/MongoClientWithLog";
import { StorageInMemoryBuilder } from "../../../storage/StorageInMemoryBuilder";
import { StorageRealBuilder } from "../../../storage/StorageRealBuilder";
import { MessagePacket } from "../../domain/model/MessageStored";
import { MessageStoredBuilder } from "../../domain/model/MessageStoredBuilder";
import { MultiPacketsReceivedMessage } from "../../domain/model/MultiPacketsReceivedMessage";
import { SendingMessageBuilder } from "../../domain/model/SendingMessageBuilder";
import { MessageStoragePort } from "../../domain/port/MessageStoragePort";
import { MessageNotFoundError } from "../../Errors/MessageNotFoundError";
import { ResourceNotFoundError } from "../../Errors/ResourceNotFoundError";
import MessageStorage from "./MessageStorage";
import { MessageStorageInMemory } from "./MessageStorageInMemory";

objectStoredJestMatcher()

describe.each([
    [new StorageRealBuilder<MessageStorage>((mongoClient) => new MessageStorage(new MongoClientWithLog(mongoClient!)))],
    [new StorageInMemoryBuilder<MessageStorageInMemory>(() => new MessageStorageInMemory())]

])('Message storage %s', (
    messageStorageBuilder
) => {
    let messageStorage: MessageStoragePort;
    let dateSimulator: DateSimulator;

    const userId = '668e97d7f3a1fb023055c1e2'
    const conversationId = "+21655001002"
    const conversationIdHex = Buffer.from(conversationId, 'utf8').toString('hex');

    async function createAndStoreMessage(destinationPhoneNumber: string = '', anotherUserId = '', box = '', status = '', read: boolean = false) {
        const messageBuilder = new SendingMessageBuilder();
        if (destinationPhoneNumber !== '') {
            messageBuilder.withDestinationPhoneNumber(destinationPhoneNumber)
        }
        if (box !== '') {
            messageBuilder.withBox(box)
        }
        if (status !== '') {
            messageBuilder.withStatus(status)
        }
        messageBuilder.withContent(`aMessage ${randomUUID()}`)

        messageBuilder.withRead(read);
        const message = messageBuilder.build()
        const messageStored = await messageStorage.storeMessage(
            message,
            anotherUserId !== '' ? anotherUserId : userId
        );

        return messageStored;
    }

    async function createAndStoreDeletedMessage(destinationPhoneNumber: string = '', anotherUserId = '') {
        const messageBuilder = new SendingMessageBuilder();
        if (destinationPhoneNumber !== '') {
            messageBuilder.withDestinationPhoneNumber(destinationPhoneNumber)
        }
        messageBuilder.withDeleted(true)
        const message = messageBuilder.build()
        const messageStored = await messageStorage.storeMessage(
            message,
            anotherUserId !== '' ? anotherUserId : userId
        );
        return messageStored;
    }


    beforeEach(async () => {
        dateSimulator = new DateSimulator();
        messageStorage = await messageStorageBuilder.build();
    });
    afterEach(async () => {
        await messageStorageBuilder.close()
        dateSimulator.restore()
    })

    test('save a message', async () => {
        const message = new SendingMessageBuilder().withContent('aMessageContent').build()

        await messageStorage.storeMessage(
            message,
            userId
        );

        expect((await messageStorage.messages(userId))[0].recipient).toEqual(message.recipient)
        expect((await messageStorage.messages(userId))[0].content).toEqual(message.content)
    });

    test('save a message, saved all fields', async () => {
        const unitaryMessage = new SendingMessageBuilder().build()

        await messageStorage.storeMessage(
            unitaryMessage,
            userId
        );

        const messageStored = (await messageStorage.messages(userId))[0];
        expect(messageStored.errorCode).toEqual('')
        expect(messageStored.hubMessageId).toBeUndefined()
        expect((await messageStorage.messages(userId))[0].sendingDate).toEqual(unitaryMessage.sendingDate)
    });

    test('save then read a message from allMessages keep content readable', async () => {
        const message = new SendingMessageBuilder().withContent('aContent').build()

        await messageStorage.storeMessage(
            message,
            userId
        );

        expect((await messageStorage.messages(userId))[0].content).toEqual(message.content)
    });

    test('when saving a message, ctime and mtime are the same', async () => {
        const message = new SendingMessageBuilder().build()
        const creationDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(creationDate);

        await messageStorage.storeMessage(
            message,
            userId
        );

        const messageStored = (await messageStorage.messages(userId))[0];
        expect(messageStored.ctime).toEqual(new Date(creationDate))
        expect(messageStored.mtime).toEqual(new Date(creationDate))
    });

    test('find message by hubMessageId', async () => {
        const message = new SendingMessageBuilder().whithHubMessageId('123').withContent('aMessage').build()
        await messageStorage.storeMessage(
            message,
            userId
        );

        const messageStored = await messageStorage.messageByHubMessageId('123');

        expect(messageStored.content).toEqual(message.content)
    })

    test('throw messageNotFound on find message by hubMessageId when message doen\'t exist', async () => {

        const messagePromise = messageStorage.messageByHubMessageId('123');

        await expect(messagePromise).rejects.toThrow(new MessageNotFoundError())
    })

    test('update a messageOnSuccess, update errorCode, hubMessageId, sendingDate, status', async () => {
        const hubMessageId: string = "1234"
        const currentDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(currentDate);
        const message = await createAndStoreMessage("+33123456789");

        await messageStorage.updateSendingMessageOnSuccess(userId, message.id, hubMessageId)

        const messageStored = (await messageStorage.messages(userId))[0];
        expect(messageStored.errorCode).toEqual("null")
        expect(messageStored.hubMessageId).toEqual(hubMessageId)
        expect(messageStored.status).toEqual('sent')
        expect(messageStored.sendingDate).toEqual(message.sendingDate)
    });

    test('update a messageOnSuccess update modification date', async () => {
        const hubMessageId: string = "1234"
        const creationDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(creationDate);
        const message = await createAndStoreMessage("+33123456789");
        const modificationDate = '2024-03-08T13:49:00.000Z';
        dateSimulator.dateIs(modificationDate);

        await messageStorage.updateSendingMessageOnSuccess(userId, message.id, hubMessageId)

        expect((await messageStorage.messages(userId))[0].mtime).toEqual(new Date(modificationDate))
    });

    test('update a messageOnFailure, update errorCode', async () => {
        const message = await createAndStoreMessage("+33123456789");
        const errorCode: string = "some error code"

        await messageStorage.updateSendingMessageOnFailure(userId, message.id, errorCode)

        expect((await messageStorage.messages(userId))[0].errorCode).toEqual(errorCode)
    });

    test('update a messageOnFailure, modification date', async () => {
        const creationDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(creationDate);
        const message = await createAndStoreMessage("+33123456789");
        const errorCode: string = "some error code"
        const modificationDate = '2024-03-08T13:49:00.000Z';
        dateSimulator.dateIs(modificationDate);

        await messageStorage.updateSendingMessageOnFailure(userId, message.id, errorCode)

        expect((await messageStorage.messages(userId))[0].mtime).toEqual(new Date(modificationDate))
    });

    test('on succeded received sended message, the status is received', async () => {
        const message = await createAndStoreMessage("+33123456789");

        await messageStorage.updateSentMessageReceivedOnSuccess(message.id)

        expect((await messageStorage.messages(userId))[0].status).toEqual('received')
    });

    test('on succeded received sent message, the error code is empty', async () => {
        const message = await createAndStoreMessage("+33123456789");

        await messageStorage.updateSentMessageReceivedOnSuccess(message.id)

        expect((await messageStorage.messages(userId))[0].errorCode).toEqual('null')
    });

    test('on succeded received sended message, change the modification date', async () => {
        const creationDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(creationDate);
        const message = await createAndStoreMessage("+33123456789");
        const modificationDate = '2024-03-08T13:49:00.000Z';
        dateSimulator.dateIs(modificationDate);

        await messageStorage.updateSentMessageReceivedOnSuccess(message.id)

        expect((await messageStorage.messages(userId))[0].mtime).toEqual(new Date(modificationDate))
    });

    test('on error received after sent message, the error code is set', async () => {
        const message = await createAndStoreMessage("+33123456789");
        const error = 'anError'

        await messageStorage.updateSentMessageReceivedOnError(message.id, error)

        expect((await messageStorage.messages(userId))[0].errorCode).toEqual(error)
    });

    test('on error received after sent message, change the modification date', async () => {
        const creationDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(creationDate);
        const message = await createAndStoreMessage("+33123456789");
        const error = 'anError'
        const modificationDate = '2024-03-08T13:49:00.000Z';
        dateSimulator.dateIs(modificationDate);

        await messageStorage.updateSentMessageReceivedOnError(message.id, error)

        expect((await messageStorage.messages(userId))[0].mtime).toEqual(new Date(modificationDate))
    });

    test('on first upsertPacket for a long sms, store a message with status receiving', async () => {
        const multiPacketsReceivedMessage =
            new MultiPacketsReceivedMessage('1', 1, '123', '+33123456789', 'aContent', new Date(), 2);

        await messageStorage.storeMultiPacketsReceivedMessages(userId, multiPacketsReceivedMessage);

        expect((await messageStorage.messages(userId))[0].status).toEqual('receiving')
        expect((await messageStorage.messages(userId))[0].receivedPackets).toEqual(1)
    })

    test('on first upsertPacket for a long sms, store a message with all is field', async () => {
        dateSimulator.dateIs('2024-06-24T10:36:01.302Z');
        const multiPacketsReceivedMessage = new MultiPacketsReceivedMessage('1', 1, '123', '+33123456789', 'aContent', new Date(), 2);

        await messageStorage.storeMultiPacketsReceivedMessages(userId, multiPacketsReceivedMessage);

        const expectedMessageStored = new MessageStoredBuilder()
            .withUserId(userId)
            .withStatus('receiving')
            .withBox('inbox')
            .withReceivedPackets(1)
            .withSize(1)
            .withHubMessageId(multiPacketsReceivedMessage.hubMessageId)
            .withRecipient(multiPacketsReceivedMessage.recipient)
            .withSendingDate(multiPacketsReceivedMessage.sendingDate)
            .withMessagesNumber(2)
            .withPackets([new MessagePacket(multiPacketsReceivedMessage.msgId, multiPacketsReceivedMessage.packetId, multiPacketsReceivedMessage.content)])
            .build()
        expect((await messageStorage.messages(userId))[0]).toEqualIgnoringId(expectedMessageStored)
    })

    test('on first upsertPacket for a long sms, store a message with one packet', async () => {
        const multiPacketsReceivedMessage = new MultiPacketsReceivedMessage('1', 1, '123', '+33123456789', 'aContent', new Date(), 2);

        await messageStorage.storeMultiPacketsReceivedMessages(userId, multiPacketsReceivedMessage);

        expect((await messageStorage.messages(userId))[0].packets.length).toEqual(1)
        expect((await messageStorage.messages(userId))[0].packets[0]).toEqual(
            new MessagePacket(multiPacketsReceivedMessage.msgId, multiPacketsReceivedMessage.packetId, multiPacketsReceivedMessage.content)
        )
    })

    test('on second upsertPacket for a long sms, increment receivedPackets field by 1', async () => {
        const multiPacketsReceivedMessage1 = new MultiPacketsReceivedMessage('1', 1, '123', '+33123456789', 'a first part content', new Date(), 3);
        await messageStorage.storeMultiPacketsReceivedMessages(userId, multiPacketsReceivedMessage1);
        const multiPacketsReceivedMessage2 = new MultiPacketsReceivedMessage('1', 1, '123', '+33123456789', 'a second part content', new Date(), 3);

        await messageStorage.storeMultiPacketsReceivedMessages(userId, multiPacketsReceivedMessage2);

        const messageStored = (await messageStorage.messages(userId))[0];
        expect(messageStored.receivedPackets).toEqual(2)
    })

    test('on second upsertPacket for a long sms, add packet to the stored message', async () => {
        const multiPacketsReceivedMessage1 = new MultiPacketsReceivedMessage('1', 1, '123', '+33123456789', 'a first part content', new Date(), 3);
        await messageStorage.storeMultiPacketsReceivedMessages(userId, multiPacketsReceivedMessage1);
        const multiPacketsReceivedMessage2 = new MultiPacketsReceivedMessage('1', 2, '123', '+33123456789', 'a second part content', new Date(), 3);

        await messageStorage.storeMultiPacketsReceivedMessages(userId, multiPacketsReceivedMessage2);

        const messageStored = (await messageStorage.messages(userId))[0];
        expect(messageStored.packets.length).toEqual(2)
    })

    test('on final upsertPacket for a long sms, finalize stored message', async () => {
        const multiPacketsReceivedMessage1 = new MultiPacketsReceivedMessage('1', 1, '123', '+33123456789', 'a first part content', new Date(), 2);
        await messageStorage.storeMultiPacketsReceivedMessages(userId, multiPacketsReceivedMessage1);
        const multiPacketsReceivedMessage2 = new MultiPacketsReceivedMessage('1', 2, '123', '+33123456789', 'a second part content', new Date(), 2);

        await messageStorage.storeMultiPacketsReceivedMessages(userId, multiPacketsReceivedMessage2);

        const messageStored = (await messageStorage.messages(userId))[0];
        expect(messageStored.packets.length).toEqual(0)
        expect(messageStored.status).toEqual('received')
        expect(messageStored.receivedPackets).toEqual(multiPacketsReceivedMessage1.messagesNumber)
        expect(messageStored.size).toEqual((multiPacketsReceivedMessage1.content+multiPacketsReceivedMessage2.content).length)
        expect(messageStored.content).toEqual(multiPacketsReceivedMessage1.content+multiPacketsReceivedMessage2.content)
        expect(messageStored.hubMessageId).toBeUndefined()
    })

    test('on receiving twice the same packet, do not finalize the message', async () => {
        const multiPacketsReceivedMessage1 = new MultiPacketsReceivedMessage('1', 1, '123', '+33123456789', 'a first part content', new Date(), 2);
        await messageStorage.storeMultiPacketsReceivedMessages(userId, multiPacketsReceivedMessage1);

        await messageStorage.storeMultiPacketsReceivedMessages(userId, multiPacketsReceivedMessage1);

        const messageStored = (await messageStorage.messages(userId))[0];
        expect(messageStored.packets.length).toBeGreaterThan(0)
        expect(messageStored.content).toEqual('')
    })

    test("delete the message successfully", async () => {
        const message = await createAndStoreMessage("+33123456789");

        const softDeleteMessageByIdPromise = messageStorage.flagAsDeleted(message.id, userId)

        await expect(softDeleteMessageByIdPromise).resolves.not.toThrow();
    })

    test("delete the message update is mdate (modification date)", async () => {
        const message = await createAndStoreMessage("+33123456789");
        const modificationDate = '2024-02-08T13:49:00.000Z';
        dateSimulator.dateIs(modificationDate);

        await messageStorage.flagAsDeleted(message.id, userId)

        const storedMessage = await messageStorage.messages(userId)
        expect(storedMessage[0].mtime!).toEqual(new Date(modificationDate));
    })

    test("delete a message flag it as deleted", async () => {
        const message = await createAndStoreMessage("+33123456789");

        await messageStorage.flagAsDeleted(message.id, userId)

        const storedMessage = await messageStorage.messages(userId)
        expect(storedMessage[0].deleted).toEqual(true);
    })

    test("throw MessageNotFoundError when deleted a non existing message's", async () => {
        const messageId = "123456789012123456789012"
        const expectedError = new MessageNotFoundError()

        const softDeleteMessageByIdPromise = messageStorage.flagAsDeleted(messageId, userId)

        await expect(softDeleteMessageByIdPromise).rejects.toThrow(expectedError)
    })

    test("throw MessageNotFoundError when document is already flaged as deleted (modifiedCount === 0)", async () => {
        const expectedError = new MessageNotFoundError()
        const message = await createAndStoreMessage("+33123456789");
        await messageStorage.flagAsDeleted(message.id, userId)

        const softDeleteMessageByIdPromise = messageStorage.flagAsDeleted(message.id, userId)

        await expect(softDeleteMessageByIdPromise).rejects.toThrow(expectedError)
    });

    test('listConversations handles empty conversations', async () => {
        const conversations = await messageStorage.conversations(userId);
        expect(conversations.length).toBe(0);
    });

    test('listConversations retrieves all conversations', async () => {
        await createAndStoreMessage("+33123456789");
        await createAndStoreMessage("+33123456788");

        const conversations = await messageStorage.conversations(userId);

        expect(conversations.length).toBe(2);
    });

    test('listConversations counts total messages correctly', async () => {
        await createAndStoreMessage("+33123456789");
        await createAndStoreMessage("+33123456789");
        await createAndStoreMessage("+33123456788");

        const conversations = await messageStorage.conversations(userId);

        const conversation1 = conversations.find(conv => conv.recipient === "+33123456789");
        const conversation2 = conversations.find(conv => conv.recipient === "+33123456788");
        expect(conversation1!.messagesNumber).toBe(2);
        expect(conversation2!.messagesNumber).toBe(1);
    });

    test('listConversations handles multiple users correctly', async () => {
        const user1Message1 = new SendingMessageBuilder().withDestinationPhoneNumber("+33123456789").build();
        const user1Message2 = new SendingMessageBuilder().withDestinationPhoneNumber("+33123456788").build();
        const user2Message1 = new SendingMessageBuilder().withDestinationPhoneNumber("+33123456787").build();
        await messageStorage.storeMessage(user1Message1, userId);
        await messageStorage.storeMessage(user1Message2, userId);
        await messageStorage.storeMessage(user2Message1, '668e97d7f3a1fb023055c1e1');

        const user1Conversations = await messageStorage.conversations(userId);
        const user2Conversations = await messageStorage.conversations('668e97d7f3a1fb023055c1e1');

        expect(user1Conversations.length).toBe(2);
        expect(user2Conversations.length).toBe(1);
    });

    test('listConversations filters out deleted messages', async () => {
        await createAndStoreDeletedMessage();

        const conversations = await messageStorage.conversations(userId);

        expect(conversations.length).toBe(0);
    });

    test('listConversations includes only inbox and outbox messages', async () => {
        await createAndStoreMessage("+33123456789", userId, 'inbox');
        await createAndStoreMessage("+33123456788", userId, 'draft');
        await createAndStoreMessage("+33123456789", userId, 'outbox');

        const conversations = await messageStorage.conversations(userId);

        expect(conversations.length).toBe(1);
        expect(conversations[0].recipient).toBe("+33123456789");
    });

    test('listConversations excludes messages with status receiving', async () => {
        await createAndStoreMessage("+33123456789", userId, 'inbox', 'receiving');
        await createAndStoreMessage("+33123456788", userId, 'inbox');
        await createAndStoreMessage("+33123456789", userId, 'outbox', 'sent');

        const conversations = await messageStorage.conversations(userId);

        expect(conversations.length).toBe(2);
        const convWithRecipient1 = conversations.find(conv => conv.recipient === "+33123456789");
        expect(convWithRecipient1!.messagesNumber).toBe(1);
    });

    test('listConversations retrieves correct unread count', async () => {
        const message1 = await createAndStoreMessage("+33123456789");
        await createAndStoreMessage("+33123456788");
        await createAndStoreMessage("+33123456789");
        await messageStorage.markMessageAsRead(userId, message1.id);

        const conversations = await messageStorage.conversations(userId);

        const user1Conversation = conversations.find(conv => conv.recipient === "+33123456789");
        const user2Conversation = conversations.find(conv => conv.recipient === "+33123456788");
        expect(user1Conversation!.unread).toBe(1);
        expect(user2Conversation!.unread).toBe(1);
    });

    test('listConversations retrieves the correct last message content', async () => {
        dateSimulator.dateIs('2024-06-24T10:36:00.000Z');
        await createAndStoreMessage("+33123456788");
        dateSimulator.dateIs('2024-06-24T10:38:00.000Z');
        const message2 = await createAndStoreMessage("+33123456788");

        const conversations = await messageStorage.conversations(userId);

        expect(conversations[0].lastMessageContent).toBe(message2.content);
    });

    test('listConversations do not count deleted messages', async () => {
        dateSimulator.dateIs('2024-06-24T10:36:00.000Z');
        const message1 = await createAndStoreMessage("+33123456788");
        dateSimulator.dateIs('2024-06-24T10:38:00.000Z');
        await createAndStoreDeletedMessage("+33123456788");

        const conversations = await messageStorage.conversations(userId);

        expect(conversations.length).toEqual(1);
        expect(conversations[0].lastMessageContent).toEqual(message1.content);
        expect(conversations[0].messagesNumber).toEqual(1);
    });

    test('getConversationById returns the correct conversation', async () => {
        await createAndStoreMessage(conversationId)

        const conversation = await messageStorage.conversation(userId, conversationIdHex);

        expect(conversation.recipient).toEqual(conversationId);
    });

    test('getConversationById throws ResourceNotFoundError when conversation is not found', async () => {
        await expect(messageStorage.conversation(userId, conversationIdHex)).rejects.toThrow(ResourceNotFoundError);
    });


    test('getConversationById returns the correct conversation with multiple messages', async () => {
        await createAndStoreMessage(conversationId)
        await createAndStoreMessage(conversationId)

        const conversation = await messageStorage.conversation(userId, conversationIdHex);

        expect(conversation.recipient).toEqual(conversationId);
        expect(conversation.messagesNumber).toEqual(2);
    });

    test('getConversationById returns the correct unread count', async () => {
        const message1 = await createAndStoreMessage(conversationId)
        await createAndStoreMessage(conversationId)
        await messageStorage.markMessageAsRead(userId, message1.id);

        const conversation = await messageStorage.conversation(userId, conversationIdHex);

        expect(conversation.recipient).toEqual(conversationId);
        expect(conversation.unread).toEqual(1);
    });

    test('getConversationById returns the last message content correctly', async () => {
        dateSimulator.dateIs('2024-06-24T10:36:00.000Z');
        await createAndStoreMessage(conversationId)
        dateSimulator.dateIs('2024-06-24T10:38:00.000Z');
        const message2 = await createAndStoreMessage(conversationId)

        const conversation = await messageStorage.conversation(userId, conversationIdHex);

        expect(conversation.recipient).toEqual(conversationId);
        expect(conversation.lastMessageContent).toEqual(message2.content);
    });

    test('getMessagesOfConversation handles empty conversation', async () => {
        const messages = await messageStorage.messagesOfConversation(userId, conversationIdHex);

        expect(messages.length).toBe(0);
    });

    test('getMessagesOfConversation retrieves messages of a conversation', async () => {
        const message1 = await createAndStoreMessage(conversationId)
        const message2 = await createAndStoreMessage(conversationId)

        const messages = await messageStorage.messagesOfConversation(userId, conversationIdHex);

        expect(messages.length).toBe(2);
        expect(messages[0].content).toBe(message1.content);
        expect(messages[1].content).toBe(message2.content);
    });

    test('getMessagesOfConversation filters out deleted messages', async () => {
        const message1 = await createAndStoreMessage(conversationId)
        await createAndStoreDeletedMessage(conversationId)

        const messages = await messageStorage.messagesOfConversation(userId, conversationIdHex);

        expect(messages.length).toBe(1);
        expect(messages[0].content).toBe(message1.content);
    });

    test('getMessagesOfConversation filters out messages where box is not in outbox or intbox', async () => {
        const message1 = await createAndStoreMessage(conversationId)
        await createAndStoreMessage(conversationId, userId, 'no_box')

        const messages = await messageStorage.messagesOfConversation(userId, conversationIdHex);

        expect(messages.length).toBe(1);
        expect(messages[0].content).toBe(message1.content);
    });

    test('getMessagesOfConversation filters out messages where status is receiving', async () => {
        const message1 = await createAndStoreMessage(conversationId)
        await createAndStoreMessage(conversationId, userId, 'inbox', 'receiving')

        const messages = await messageStorage.messagesOfConversation(userId, conversationIdHex);

        expect(messages.length).toBe(1);
        expect(messages[0].content).toBe(message1.content);
    });

    test('delete a conversation by its ID', async () => {
        await createAndStoreMessage(conversationId)
        await createAndStoreMessage(conversationId)

        await messageStorage.deleteConversation(userId, conversationIdHex)

        const conversations = await messageStorage.conversations(userId);
        expect(conversations.length).toBe(0);
    });

    test('throw ResourceNotFoundError if the conversationId does not exist', async () => {
        const nonExistentConversationId = 'nonexistent';
        await createAndStoreMessage(conversationId)

        await expect(messageStorage.deleteConversation(userId, nonExistentConversationId)).rejects.toThrow(ResourceNotFoundError);
    });

    test('throw ResourceNotFoundError no conversation exists with the userid', async () => {
        const nonexistentUserId = '668e97d7f3a1fb023055c1e1';
        await createAndStoreMessage(conversationId)

        await expect(messageStorage.deleteConversation(nonexistentUserId, conversationIdHex)).rejects.toThrow(ResourceNotFoundError);
    });

    test('throw ResourceNotFoundError when all the messages of conversations are already deleted', async () => {
        await createAndStoreMessage(conversationId)
        await createAndStoreMessage(conversationId)
        await messageStorage.deleteConversation(userId, conversationIdHex)

        await expect(messageStorage.deleteConversation(userId, conversationIdHex)).rejects.toThrow(ResourceNotFoundError);
    });

    test('updates read status to true for unread messages', async () => {
        const isRead = false;
        await createAndStoreMessage(conversationId, '', 'inbox', '', isRead);
        await createAndStoreMessage(conversationId, '', 'inbox', '', isRead);

        await messageStorage.markAsReadConversation(userId, conversationIdHex);

        const updatedMessages = await messageStorage.messagesOfConversation(userId, conversationIdHex);
        updatedMessages.forEach(msg => {
            expect(msg.read).toBe(!isRead);
        });
    });

    test('does not update read status for already read messages', async () => {
        const isRead = true;
        await createAndStoreMessage(conversationId, '', 'inbox', '', isRead);
        await createAndStoreMessage(conversationId, '', 'inbox', '', isRead);

        await messageStorage.markAsReadConversation(userId, conversationIdHex);

        const updatedMessages = await messageStorage.messagesOfConversation(userId, conversationIdHex);
        updatedMessages.forEach(msg => {
            expect(msg.read).toBe(isRead);
        });
    });

    test('does not update read status for messages in outbox', async () => {
        const isRead = false;
        await createAndStoreMessage(conversationId, '', 'outbox', '', isRead);
        await createAndStoreMessage(conversationId, '', 'outbox', '', isRead);

        await messageStorage.markAsReadConversation(userId, conversationIdHex);

        const updatedMessages = await messageStorage.messagesOfConversation(userId, conversationIdHex);
        updatedMessages.forEach(msg => {
            expect(msg.read).toBe(isRead);
            expect(msg.box).toBe('outbox');
        });
    });

    test('does not update read status for messages with status receiving', async () => {
        const isRead = false;
        await createAndStoreMessage(conversationId, '', 'inbox', '', isRead);
        await createAndStoreMessage(conversationId, '', 'inbox', 'receiving', isRead);

        await messageStorage.markAsReadConversation(userId, conversationIdHex);

        const updatedMessages = await messageStorage.messagesOfConversation(userId, conversationIdHex);
        updatedMessages.forEach(msg => {
            if (msg.status === 'receiving') {
                expect(msg.read).toBe(isRead);
            } else {
                expect(msg.read).toBe(!isRead);
            }
        });
    });

    test('does not update read status for deleted messages', async () => {
        const message = await createAndStoreMessage(conversationId);
        await messageStorage.flagAsDeleted(message.id, userId);

        await messageStorage.markAsReadConversation(userId, conversationIdHex);

        const updatedMessages = await messageStorage.messagesOfConversation(userId, conversationIdHex);
        updatedMessages.forEach(msg => {
            expect(msg.read).toBe(false);
        });
    });

    test('no messages to update', async () => {

        await messageStorage.markAsReadConversation(userId, conversationIdHex);

        const updatedMessages = await messageStorage.messagesOfConversation(userId, conversationIdHex);
        expect(updatedMessages.length).toBe(0);
    });

    test('update mtime when updating conversation read status', async () => {
        const isRead = false;
        await createAndStoreMessage(conversationId, '', 'inbox', '', isRead);
        await createAndStoreMessage(conversationId, '', 'inbox', '', isRead);
        const modificationDate = '2024-07-18T08:56:59.311Z';
        dateSimulator.dateIs(modificationDate);

        await messageStorage.markAsReadConversation(userId, conversationIdHex);

        const updatedMessages = await messageStorage.messagesOfConversation(userId, conversationIdHex);
        updatedMessages.forEach(msg => {
            expect(msg.mtime).toEqual(new Date(modificationDate));
        });
    });

    test('mtime remains unchanged when read status doesn’t change', async () => {
        const isRead = true;
        const message = await createAndStoreMessage(conversationId, '', 'inbox', '', isRead);
        const initialMessages = await messageStorage.messagesOfConversation(userId, conversationIdHex);
        const initialMessage = initialMessages.find(msg => msg.id.toString() === message.id.toString());
        const initialMtime = initialMessage!.mtime;

        await messageStorage.markAsReadConversation(userId, conversationIdHex);

        const updatedMessages = await messageStorage.messagesOfConversation(userId, conversationIdHex);
        const updatedMessage = updatedMessages.find(msg => msg.id.toString() === message.id.toString());
        expect(updatedMessage!.mtime).toEqual(initialMtime);
    });

    test('countUnreadedMessages returns correct count of unread messages', async () => {
        await createAndStoreMessage('123', '', 'inbox', '', false);
        await createAndStoreMessage('124', '', 'inbox', '', false);
        await createAndStoreMessage('125', '', 'inbox', '', true);

        const unreadCount = await messageStorage.countUnreadedMessages(userId);
        expect(unreadCount).toBe(2);
    });

    test('countUnreadedMessages returns 0 when there are no unread messages', async () => {
        await createAndStoreMessage('123', '', 'inbox', '', true);
        await createAndStoreMessage('124', '', 'inbox', '', true);

        const unreadCount = await messageStorage.countUnreadedMessages(userId);
        expect(unreadCount).toBe(0);
    });

    test('countUnreadedMessages does not include deleted messages', async () => {
        await createAndStoreMessage('123', '', 'inbox', '', false);
        const message = await createAndStoreMessage('124', '', 'inbox', '', false);
        await messageStorage.flagAsDeleted(message.id, userId);

        const unreadCount = await messageStorage.countUnreadedMessages(userId);
        expect(unreadCount).toBe(1);
    });

    test('countUnreadedMessages handles no messages gracefully', async () => {
        const unreadCount = await messageStorage.countUnreadedMessages(userId);
        expect(unreadCount).toBe(0);
    });
});
