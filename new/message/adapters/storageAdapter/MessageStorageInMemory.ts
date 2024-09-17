import {v4 as uuidv4} from "uuid";
import {CryptoService} from "../../../crypto/CryptoService";
import {DateProvider} from "../../../date-provider/DateProvider";
import {MessagePacket, MessageStored} from "../../domain/model/MessageStored";
import {MessageStoragePort} from "../../domain/port/MessageStoragePort";
import {MessageNotFoundError} from "../../Errors/MessageNotFoundError";
import {ResourceNotFoundError} from "../../Errors/ResourceNotFoundError";
import Conversation from "./Conversation";
import {Message} from "../../domain/model/Message";
import {MultiPacketsReceivedMessage} from "../../domain/model/MultiPacketsReceivedMessage";

interface AggregatedConversation {
    recipient: string;
    unread: number;
    messagesNumber: number;
    lastMessageContent: string;
    mtime: Date;
    ctime: Date;
}

export class MessageStorageInMemory extends MessageStoragePort {
    public messagesInMemory: Array<MessageStored> =
        new Array<MessageStored>();
    private error: Error | undefined;
    public nextId = uuidv4();

    async storeMessage(message: Message, userId: string) {
        if (this.error) {
            throw this.error;
        }

        try {
            const newMessage = new MessageStored(
                message.recipient,
                userId,
                message.deferred,
                message.deferredDate,
                message.deferredAck,
                message.subject,
                message.box,
                message.size,
                message.receivedPackets,
                message.messagesNumber,
                message.status,
                message.errorCode,
                message.replyType,
                message.replyNotification,
                CryptoService.encryptValue(message.content),
                message.messageHeader,
                message.hubMessageId,
                message.deleted,
                DateProvider.now(),
                DateProvider.now(),
                message.sendingDate,
                this.nextId,
                message.read
            );
            this.messagesInMemory.push(newMessage);
            this.nextId = uuidv4();
            return this.mapToDecryptedMessageStored(newMessage);
        } catch (error: any) {
            throw new Error();
        }
    }

    async storeMultiPacketsReceivedMessages(userId: string, multiPacketsReceivedMessage: MultiPacketsReceivedMessage): Promise<void> {
        //TODO ce code est pas beau. à revoir

        const messages = this.messagesInMemory.filter(
            (msg) => {
                return msg.user === userId
                    && msg.hubMessageId === multiPacketsReceivedMessage.hubMessageId
                    && msg.status === 'receiving'
            });

        if (messages.length === 1) {
            messages[0].receivedPackets++;
            messages[0].packets.push(new MessagePacket(multiPacketsReceivedMessage.msgId, multiPacketsReceivedMessage.packetId, multiPacketsReceivedMessage.content))

            if (messages[0].packets.length >= messages[0].messagesNumber) {
                let fullContent = ''
                for (let i = 1; i <= messages[0].messagesNumber; i++) {
                    const packet = messages[0].packets.find((item) => item.packetId === i);

                    if (!packet) {
                        // we're missing a packet, stop right there. Maybe we received one of the packets twice, so we
                        // assumed it was time to build up the content, but we're missing a packet, so it's not.
                        return;
                    }

                    fullContent += packet.content;
                }
                messages[0].content = CryptoService.encryptValue(fullContent)
                messages[0].receivedPackets = messages[0].messagesNumber
                messages[0].status = 'received'
                messages[0].size = fullContent.length
                messages[0].packets = []
                messages[0].hubMessageId = undefined
            }
            return
        }
        // else create message
        const newMessage = new MessageStored(
            multiPacketsReceivedMessage.recipient,
            userId,
            false,
            '',
            false,
            '',
            'inbox',
            1,
            1,
            multiPacketsReceivedMessage.messagesNumber,
            'receiving',
            '',
            '',
            false,
            CryptoService.encryptValue(''),
            '',
            multiPacketsReceivedMessage.hubMessageId,
            false,
            DateProvider.now(),
            DateProvider.now(),
            multiPacketsReceivedMessage.sendingDate,
            this.nextId,
            false,
            [new MessagePacket(multiPacketsReceivedMessage.msgId, multiPacketsReceivedMessage.packetId, multiPacketsReceivedMessage.content)]
        );
        this.messagesInMemory.push(newMessage);
        this.nextId = uuidv4();
    }

    async updateSendingMessageOnSuccess(
        userId: string,
        messageId: string,
        hubMessageId: string
    ) {
        let status = "sent";
        let sendingDate = DateProvider.now();
        let errorCode = "null";
        let mtime = DateProvider.now();
        const message = this.messagesInMemory.filter(
            (msg) => msg.id === messageId && msg.user === userId
        );

        if (message === undefined || message.length === 0) {
            throw new Error();
        }
        (message[0].status = status),
            (message[0].hubMessageId = hubMessageId),
            (message[0].errorCode = errorCode),
            (message[0].sendingDate = sendingDate),
            (message[0].mtime = mtime);
        return message[0];
    }

    async updateSendingMessageOnFailure(
        userId: string,
        messageId: string,
        errorCode: string
    ) {
        let mtime = DateProvider.now();
        const message = this.messagesInMemory.filter(
            (msg) => msg.id === messageId && msg.user === userId
        );

        if (message === undefined || message.length === 0) {
            throw new Error();
        }
        (message[0].errorCode = errorCode),
            (message[0].mtime = mtime);
        return message[0];
    }

    async updateSentMessageReceivedOnSuccess(messageId: string) {
        let status = "received";
        let errorCode = "null";
        let mtime = DateProvider.now();
        const message = this.messagesInMemory.filter(
            (msg) => msg.id === messageId
        );

        if (message === undefined || message.length === 0) {
            throw new Error();
        }
        (message[0].status = status),
            (message[0].errorCode = errorCode),
            (message[0].mtime = mtime);
    }

    async updateSentMessageReceivedOnError(messageId: string, error: string) {
        let mtime = DateProvider.now();
        const message = this.messagesInMemory.filter(
            (msg) => msg.id === messageId
        );

        if (message === undefined || message.length === 0) {
            throw new Error();
        }
        (message[0].errorCode = error),
            (message[0].mtime = mtime);
    }

    async messages(userId: string) {
        if (this.error) {
            throw this.error;
        }

        const userMessages = this.messagesInMemory.filter(
            (msg) => msg.user === userId
        );
        if (!userMessages) {
            return [];
        }

        return userMessages.map((msg) =>
            this.mapToDecryptedMessageStored(msg)
        );
    }

    async messageByHubMessageId(hubMessageId: string) {
        if (this.error) {
            throw this.error;
        }

        const message = this.messagesInMemory.filter(
            (msg) => msg.hubMessageId === hubMessageId
        )[0];

        if (!message) {
            throw new MessageNotFoundError();
        }
        return this.mapToDecryptedMessageStored(message);
    }

    public async flagAsDeleted(messageId: string, userId: string): Promise<void> {
        if (this.error) {
            throw this.error;
        }

        const result = this.messagesInMemory.find((message) => {
            return (
                message.user === userId && message.id === messageId
            );
        });

        if (!result || result.deleted) {
            throw new MessageNotFoundError();
        }

        result.deleted = true;
        result.mtime = DateProvider.now();
    }

    async markMessageAsRead(userId: string, messageId: string): Promise<void> {
        const message = this.messagesInMemory.find(
            (msg) => msg.id === messageId && msg.user === userId
        );

        if (!message) {
            throw new MessageNotFoundError();
        }

        message.read = true;
        message.mtime = DateProvider.now();
    }

    async conversations(userId: string): Promise<Conversation[]> {
        let conversationList = await this.innerListConversations(userId);

        return conversationList;
    }

    private innerListConversations(
        userId: string,
        recipient?: string,
        limit?: number
    ) {
        const filter = (messageStored: MessageStored ) => {
            let match =
                messageStored.user === userId &&
                !messageStored.deleted &&
                ["inbox", "outbox"].includes(messageStored.box) &&
                !["receiving"].includes(messageStored.status);

            if (recipient) {
                match = match && messageStored.recipient === recipient;
            }

            return match;
        };

        const userMessages = this.messagesInMemory.filter(filter);

        const groupedConversations: {
            [recipient: string]: AggregatedConversation;
        } = userMessages.reduce((acc, curr) => {
            const recipient = curr.recipient;

            if (!acc[recipient]) {
                acc[recipient] = {
                    recipient,
                    unread: 0,
                    messagesNumber: 0,
                    lastMessageContent: curr.content,
                    mtime: curr.mtime,
                    ctime: curr.ctime,
                };
            }

            acc[recipient].messagesNumber++;

            if (curr.box === "inbox" && !curr.read) {
                acc[recipient].unread++;
            }

            if (
                !acc[recipient].mtime ||
                curr.mtime > acc[recipient].mtime
            ) {
                acc[recipient].lastMessageContent = curr.content;
                acc[recipient].mtime = curr.mtime;
            }

            if (curr.ctime < acc[recipient].ctime) {
                acc[recipient].ctime = curr.ctime;
            }

            return acc;
        }, {} as { [recipient: string]: AggregatedConversation });

        let conversationList = Object.values(groupedConversations).map(
            (conv: AggregatedConversation) => {
                return {
                    ...conv,
                    id: Buffer.from(conv.recipient, "utf8").toString("hex"),
                    lastMessageContent: CryptoService.decryptValue(
                        conv.lastMessageContent
                    ),
                    smsNumber: conv.messagesNumber,
                };
            }
        );

        if (limit) {
            conversationList = conversationList.slice(0, limit);
        }

        const total = conversationList.length;
        const end = total;

        (conversationList as any).$range = {
            start: 0,
            end,
            total,
        };
        return Promise.resolve(conversationList);
    }

    async conversation(
        userId: string,
        conversationId: string
    ): Promise<Conversation> {
        const recipient = Buffer.from(conversationId, "hex").toString("utf8");

        const conversations = await this.innerListConversations(
            userId,
            recipient,
            1
        );

        if (typeof conversations === "undefined" || conversations === null) {
            throw new ResourceNotFoundError({
                details: {resourceName: "conversation", id: conversationId},
                message: "result is empty",
            });
        } else if (!conversations.length) {
            throw new ResourceNotFoundError({
                details: {resourceName: "conversation", id: conversationId},
                message: "No conversation found for given id",
            });
        }

        return conversations[0];
    }

    private mapToDecryptedMessageStored(encryptedMessage: MessageStored) {
        return new MessageStored(
            encryptedMessage.recipient,
            encryptedMessage.user,
            encryptedMessage.deferred,
            encryptedMessage.deferredDate,
            encryptedMessage.deferredAck,
            encryptedMessage.subject,
            encryptedMessage.box,
            encryptedMessage.size,
            encryptedMessage.receivedPackets,
            encryptedMessage.messagesNumber,
            encryptedMessage.status,
            encryptedMessage.errorCode,
            encryptedMessage.replyType,
            encryptedMessage.replyNotification,
            CryptoService.decryptValue(encryptedMessage.content),
            encryptedMessage.messageHeader,
            encryptedMessage.hubMessageId,
            encryptedMessage.deleted,
            encryptedMessage.ctime,
            encryptedMessage.mtime,
            encryptedMessage.sendingDate,
            encryptedMessage.id,
            encryptedMessage.read,
            encryptedMessage.packets
        );
    }

    messagesOfConversation(
        userId: string,
        conversationId: string
    ): Promise<MessageStored[]> {
        const recipient = Buffer.from(conversationId, "hex").toString("utf8");
        const userMessages = this.messagesInMemory.filter(
            (msg) =>
                msg.user === userId &&
                ["inbox", "outbox"].includes(msg.box) &&
                msg.status !== "receiving" &&
                msg.recipient === recipient &&
                !msg.deleted
        );

        return Promise.resolve(
            userMessages.map((msg) =>
                this.mapToDecryptedMessageStored(msg)
            )
        );
    }

    async deleteConversation(
        userId: string,
        conversationId: string
    ): Promise<void> {
        const recipient = Buffer.from(conversationId, "hex").toString("utf8");

        let modifiedCount = 0;

        this.messagesInMemory.forEach((msg) => {
            if (
                msg.user === userId &&
                msg.recipient === recipient &&
                !msg.deleted
            ) {
                msg.deleted = true;
                msg.mtime = new Date();
                modifiedCount++;
            }
        });

        if (modifiedCount === 0) {
            throw new ResourceNotFoundError({
                details: {resourceName: "Conversation", id: conversationId},
                message: "No conversation found for given id",
            });
        }
    }

    async markAsReadConversation(
        userId: string,
        conversationId: string
    ): Promise<void> {
        return this.setConversationReadState(conversationId, userId, true);
    }

    async setConversationReadState(
        conversationId: string,
        userId: string,
        read: boolean
    ): Promise<void> {
        const recipient = Buffer.from(conversationId, "hex").toString("utf8");

        this.messagesInMemory.forEach((msg) => {
            if (
                msg.user === userId &&
                msg.recipient === recipient &&
                !msg.deleted &&
                msg.box === "inbox" &&
                msg.status !== "receiving" &&
                msg.read !== read
            ) {
                msg.read = read;
                msg.mtime = DateProvider.now();
            }
        });
    }

    async countUnreadedMessages(userId: string): Promise<number> {
        const countUnreadedMessages = this.messagesInMemory.reduce((acc, message) => {
            if (message.user === userId && message.box === 'inbox' && message.read === false && message.deleted === false) {
                return acc + 1
            } else {
                return acc
            }
        }, 0)
        return countUnreadedMessages
    }
}
