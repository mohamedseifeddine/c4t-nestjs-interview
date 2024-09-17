import {DateTime} from "luxon";
import {DateProvider} from "../../date-provider/DateProvider";
import {MessageStored} from "../../message/domain/model/MessageStored";
import {ReplySessionsNotFoundInStorageError} from "../Errors/ReplySessionsNotFoundInStorageError";
import {ReplySessionsStoragePort} from "../ReplySessionsStoragePort";
import {ReplySessionsStored} from "../ReplySessionsStored";
import {ReplySessionConflictError} from "../Errors/ReplySessionConflictError";

export class ReplySessionStorageInMemory extends ReplySessionsStoragePort {

    public ReplySessionsInMemory: Array<ReplySessionsStored> = new Array<ReplySessionsStored>();

    async createReplySessions(virtualShortCodeId: string, message: MessageStored): Promise<void> {
        const replySessionLifetime = {days: 7}; // 7 days
        const now = DateTime.fromJSDate(DateProvider.now());
        const expiration = now.plus(replySessionLifetime).toJSDate();
        let ctime = DateProvider.now()
        let mtime = DateProvider.now()
        let notification = false
        const ReplySessions = this.innerReplySession(virtualShortCodeId, message.recipient)
        if (ReplySessions) {
            throw new ReplySessionConflictError(virtualShortCodeId, message.recipient)
        }
        this.ReplySessionsInMemory.push(new ReplySessionsStored(virtualShortCodeId, message.id!, message.recipient, message.user, notification, expiration, ctime, mtime))
        return Promise.resolve();
    }

    async replySessions(virtualShortCodeId: string, recepient: string): Promise<ReplySessionsStored> {
        const ReplySessions = this.innerReplySession(virtualShortCodeId, recepient);
        if (ReplySessions === undefined) {
            throw new ReplySessionsNotFoundInStorageError(virtualShortCodeId, recepient);
        }
        return ReplySessions;
    }

    private innerReplySession(virtualShortCodeId: string, recepient: string) {
        const replySessionLifetime = 7; // 7 days
        const now = DateTime.fromJSDate(DateProvider.now());
        const replySessions = this.ReplySessionsInMemory.find(replySession =>
            (replySession.virtualShortCodeId === virtualShortCodeId && replySession.recipient === recepient)
        );
        if (replySessions) {
            const sessionCtime = DateTime.fromJSDate(replySessions.ctime);
            if (now.diff(sessionCtime, "days").days > replySessionLifetime) {
                this.ReplySessionsInMemory = this.ReplySessionsInMemory.filter(
                    replySession =>
                        (replySession.virtualShortCodeId !== virtualShortCodeId && replySession.recipient !== recepient)
                )
            } else {
                return replySessions;
            }
        }
    }
}
