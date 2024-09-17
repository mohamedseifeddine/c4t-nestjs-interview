import mongoose, { Schema } from "mongoose";
import { CryptoService } from "../../../crypto/CryptoService";
import { DateProvider } from "../../../date-provider/DateProvider";
import { MongoClientWithLog } from "../../../storage/MongoClientWithLog";
import { MongoModelWithLog } from "../../../storage/MongoModelWithLog";
import { StorageUtils } from "../../../storage/StorageUtils";
import { Message } from "../../domain/model/Message";
import { MessagePacket, MessageStored } from "../../domain/model/MessageStored";
import { MultiPacketsReceivedMessage } from "../../domain/model/MultiPacketsReceivedMessage";
import { MessageStoragePort } from "../../domain/port/MessageStoragePort";
import { MessageNotFoundError } from "../../Errors/MessageNotFoundError";
import { ResourceNotFoundError } from "../../Errors/ResourceNotFoundError";
import Conversation from "./Conversation";

export default class MessageStorage extends MessageStoragePort {
    messageModel: MongoModelWithLog;

    constructor(mongoClient: MongoClientWithLog) {
        super();
        this.messageModel = mongoClient.model(
            "messages",
            new mongoose.Schema({
                recipient: String,
                user: Schema.Types.ObjectId, // objectId from collection user._id TODO add ref to user collection
                deferred: Boolean,
                deferredDate: String,
                deferredAck: Boolean,
                subject: String,
                box: String,
                size: Number,
                receivedPackets: Number,
                messagesNumber: Number,
                status: String,
                errorCode: String,
                replyType: String,
                replyNotification: Boolean,
                content: String,
                messageHeader: String,
                hubMessageId: String,
                deleted: Boolean,
                ctime: Date,
                mtime: Date,
                sendingDate: Date,
                read: Boolean,
                packets: []
            })
        );
    }

    async storeMessage(message: Message, userId: string) {
        try {
            const newMessage = await this.messageModel.create({
                recipient: message.recipient,
                user: userId,
                deferred: message.deferred,
                deferredDate: message.deferredDate,
                deferredAck: message.deferredAck,
                subject: message.subject,
                box: message.box,
                size: message.size,
                status: message.status,
                errorCode: message.errorCode,
                replyType: message.replyType,
                replyNotification: message.replyNotification,
                content: CryptoService.encryptValue(message.content),
                messageHeader: message.messageHeader,
                hubMessageId: message.hubMessageId,
                deleted: message.deleted,
                ctime: DateProvider.now(),
                mtime: DateProvider.now(),
                sendingDate: message.sendingDate,
                read: message.read,
            });

            return this.mapToMessageStored(newMessage);
        } catch (error) {
            console.error("Erreur lors de la création du message :", error);
            throw error;
        }
    }

    async storeMultiPacketsReceivedMessages(userId: string, multiPacketsReceivedMessage: MultiPacketsReceivedMessage): Promise<void> {
        const message = await this.findCreateOrUpdateReceivingMessage(userId, multiPacketsReceivedMessage);

        // check if the current packet is the last one
        // if it's : reset some fields and concat content
        // Beware that it's possible to receive the same packet twice or more
        // It's also why we don't trust the receivedPackets counter until the message has been successfully built
        if (message.packets.length >= message.messagesNumber) {
            let fullContent = ''
            for (let i = 1; i <= message.messagesNumber; i++) {
                const packet = message.packets.find((item) => item.packetId === i);

                if (!packet) {
                    // we're missing a packet, stop right there. Maybe we received one of the packets twice, so we
                    // assumed it was time to build up the content, but we're missing a packet, so it's not.
                    return;
                }

                fullContent += packet.content;
            }

            await this.messageModel.updateOne({
                    _id: message.id,
                    user: userId,
                    status: 'receiving'
                }, {
                    $set: {
                        packets: [],
                        content: CryptoService.encryptValue(fullContent),
                        receivedPackets: message.messagesNumber,
                        status: 'received',
                        size: fullContent.length
                    },
                    $unset: {
                        hubMessageId: ''
                    }
                },
                {upsert: false}
            )
        }
    }

    private async findCreateOrUpdateReceivingMessage(userId: string, multiPacketsReceivedMessage: MultiPacketsReceivedMessage) {
        const findMessageModel = await this.messageModel.findOneAndUpdate({
                user: userId,
                hubMessageId: multiPacketsReceivedMessage.hubMessageId,
                status: 'receiving'
            }, {
                $set: {
                    recipient: multiPacketsReceivedMessage.recipient,
                    deferred: multiPacketsReceivedMessage.deferred,
                    deferredDate: multiPacketsReceivedMessage.deferredDate,
                    deferredAck: multiPacketsReceivedMessage.deferredAck,
                    subject: multiPacketsReceivedMessage.subject,
                    box: multiPacketsReceivedMessage.box,
                    size: multiPacketsReceivedMessage.size,
                    messagesNumber: multiPacketsReceivedMessage.messagesNumber,
                    errorCode: multiPacketsReceivedMessage.errorCode,
                    replyType: multiPacketsReceivedMessage.replyType,
                    replyNotification: multiPacketsReceivedMessage.replyNotification,
                    content: CryptoService.encryptValue(''),
                    messageHeader: multiPacketsReceivedMessage.messageHeader,
                    deleted: multiPacketsReceivedMessage.deleted,
                    sendingDate: multiPacketsReceivedMessage.sendingDate,
                    ctime: DateProvider.now(),
                    mtime: DateProvider.now(),
                    read: multiPacketsReceivedMessage.read,
                },
                $inc: {
                    receivedPackets: 1
                },
                $addToSet: {
                    packets: {
                        msgId: multiPacketsReceivedMessage.msgId,
                        packetId: multiPacketsReceivedMessage.packetId,
                        content: multiPacketsReceivedMessage.content
                    }
                }
            },
            {upsert: true, returnOriginal: false}
        )
        const message = this.mapToMessageStored(findMessageModel)
        return message;
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
        const result = await this.messageModel.findOneAndUpdate(
            {
                user: userId,
                _id: messageId,
            },
            {
                status: status,
                sendingDate: sendingDate,
                hubMessageId,
                errorCode,
                mtime,
            }
        );
        return result;
    }

    async updateSendingMessageOnFailure(
        userId: string,
        messageId: string,
        errorCode: string
    ) {
        let mtime = DateProvider.now();
        const result = await this.messageModel.findOneAndUpdate(
            {
                user: userId,
                _id: messageId,
            },
            {
                errorCode,
                mtime,
            }
        );
        return result;
    }


    async updateSentMessageReceivedOnSuccess(
        messageId: string,
    ) {
        let errorCode = "null";
        let mtime = DateProvider.now();
        const result = await this.messageModel.findOneAndUpdate(
            {
                _id: messageId,
            },
            {
                status: 'received',
                errorCode,
                mtime,
            }
        );
        return result;
    }

    async updateSentMessageReceivedOnError(
        messageId: string,
        error: string
    ) {
        let errorCode = error;
        let mtime = DateProvider.now();
        const result = await this.messageModel.findOneAndUpdate(
            {
                _id: messageId,
            },
            {
                errorCode: errorCode,
                mtime,
            }
        );
        return result;
    }

    async messages(userId: string): Promise<MessageStored[]> {
        const findMessageModels = await this.messageModel.find({user: userId});
        return findMessageModels.map(this.mapToMessageStored);
    }

    async messageByHubMessageId(hubMessageId: string) {
        const findMessageModel = await this.messageModel.findOne(
            {
                hubMessageId: hubMessageId
            }
        );
        this.checkMessageFound(findMessageModel)
        return this.mapToMessageStored(findMessageModel)
    }

    async flagAsDeleted(messageId: string, userId: string): Promise<void> {
        const filter = {
            _id: StorageUtils.toObjectID(messageId),
            deleted: false,
            user: userId,
        };

        const result = await this.messageModel.updateOne(filter, {
            $set: {deleted: true, mtime: DateProvider.now()},
        });

        if (result.modifiedCount === 0) {
            throw new MessageNotFoundError();
        }
    }

    private mapToMessageStored(findMessageModel: any) {
        return new MessageStored(
            findMessageModel.recipient,
            findMessageModel.user,
            findMessageModel.deferred,
            findMessageModel.deferredDate,
            findMessageModel.deferredAck,
            findMessageModel.subject,
            findMessageModel.box,
            findMessageModel.size,
            findMessageModel.receivedPackets,
            findMessageModel.messagesNumber,
            findMessageModel.status,
            findMessageModel.errorCode,
            findMessageModel.replyType,
            findMessageModel.replyNotification,
            findMessageModel.content === undefined ? '' : CryptoService.decryptValue(findMessageModel.content),
            findMessageModel.messageHeader,
            findMessageModel.hubMessageId,
            findMessageModel.deleted,
            findMessageModel.ctime,
            findMessageModel.mtime,
            findMessageModel.sendingDate,
            findMessageModel._id,
            findMessageModel.read,
            (findMessageModel.packets || []).map((packet: any) => new MessagePacket(packet.msgId, packet.packetId, packet.content))
        );
    }

    private checkMessageFound(result: any) {
        if (result === null) {
            throw new MessageNotFoundError();
        }
    }

    async markMessageAsRead(userId: string, messageId: string): Promise<void> {
        const filter = {
            _id: messageId,
            user: userId,
        };

        const update = {
            $set: {read: true, mtime: DateProvider.now()},
        };

        const result = await this.messageModel.updateOne(filter, update);

        if (result.modifiedCount === 0) {
            throw new MessageNotFoundError();
        }
    }

    async conversations(userId: string): Promise<Conversation[]> {
        const conversationList = await this.innerListConversations(userId);
        return conversationList;
    }

    private async innerListConversations(userId: string, recipient?: string, limit?: number) {
        const filter: any = {
            user: new mongoose.Types.ObjectId(userId),
            deleted: false,
        };
        if (recipient) {
            filter.recipient = recipient;
        }

        const pipelines: any = [
            {
                $match: {
                    $and: [
                        {
                            box: {$in: ["inbox", "outbox"]},
                            status: {$nin: ["receiving"]},
                        },
                        filter,
                    ],
                },
            },
            {
                $project: {
                    _id: 0,
                    recipient: 1,
                    content: 1,
                    mtime: 1,
                    ctime: 1,
                    user: 1,
                    read: 1,
                    box: 1,
                    unread: {
                        $cond: [
                            {$and: [{$eq: ["$box", "inbox"]}, {$eq: ["$read", false]}]},
                            1,
                            0,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: "$recipient",
                    user: {$first: "$user"},
                    unread: {$sum: "$unread"},
                    messagesNumber: {$sum: 1},
                    lastMessageContent: {$last: "$content"},
                    mtime: {$max: "$mtime"},
                    ctime: {$min: "$ctime"},
                },
            },
            {
                $sort: {mtime: -1}
            }
        ];
        if (limit) {
            pipelines.push({$limit: limit});
        }

        const data = await this.messageModel.aggregate(pipelines);

        const conversationList = data.map((item: any) => {
            return new Conversation(
                Buffer.from(item._id, "utf8").toString("hex"),
                item.ctime,
                item.mtime,
                item._id,
                CryptoService.decryptValue(item.lastMessageContent),
                item.unread,
                item.messagesNumber,
                item.messagesNumber
            );
        });

        const total = conversationList.length;
        const end = total;

        (conversationList as any).$range = {
            start: 0,
            end,
            total,
        };
        return conversationList;
    }

    async conversation(
        userId: string,
        conversationId: string
    ): Promise<Conversation> {
        const recipient = Buffer.from(conversationId, "hex").toString("utf8");

        const conversations = await this.innerListConversations(userId, recipient, 1);

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

    async messagesOfConversation(userId: string, conversationId: string): Promise<MessageStored[]> {
        const pipeline = [
            {
                $match: {
                    $and: [
                        {
                            user: new mongoose.Types.ObjectId(userId),
                            box: {$in: ["inbox", "outbox"]},
                            status: {$nin: ["receiving"]},
                            recipient: Buffer.from(conversationId, "hex").toString("utf8"),
                            deleted: false,
                        },
                    ],
                },
            },
        ];
        const messages = await this.messageModel.aggregate(pipeline);
        return (messages || []).map(this.mapToMessageStored);
    }

    async deleteConversation(userId: string, conversationId: string): Promise<void> {
        const recipient = Buffer.from(conversationId, "hex").toString("utf8");

        const updateResult = await this.messageModel.updateMany(
            {user: new mongoose.Types.ObjectId(userId), recipient, deleted: false},
            {$set: {deleted: true, mtime: new Date()}},
            {upsert: false}
        );

        // to check if we should test modifiedCount or matchedCount ??
        // matchedCount: Total documents that matched the query.
        // modifiedCount: Total documents that were changed by the update.
        if (updateResult.matchedCount === 0) {
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
        await this.setConversationReadState(conversationId, userId, true)
    }

    // toggle read status
    private async setConversationReadState(
        conversationId: string,
        userId: string,
        read: boolean
    ): Promise<void> {
        const recipient = Buffer.from(conversationId, "hex").toString("utf8");
        await this.messageModel.updateMany(
            {
                user: new mongoose.Types.ObjectId(userId),
                recipient,
                deleted: false,
                box: "inbox",
                status: {$nin: ["receiving"]},
                read: {$ne: read}
            },
            {
                $set: {
                    read,
                    mtime: DateProvider.now()
                }
            }
        );
    }

    async countUnreadedMessages(userId: string): Promise<number> {
        return await this.messageModel.countDocuments({
            user: new mongoose.Types.ObjectId(userId),
            box: 'inbox',
            read: false,
            deleted: false
        });
    }

}
