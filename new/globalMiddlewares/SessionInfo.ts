import * as cls from "cls-hooked";
import { SessionInfoDto } from "../message/types/types";

export class SessionInfo {

    static sessionId() {
        return cls.getNamespace('session')?.get('id')
    }

    static remoteIp() {
        return cls.getNamespace("session")?.get("remoteIp");
    }

    static storeRemoteIp(remoteIp: String | undefined) {
        cls.getNamespace('session')?.set('remoteIp', remoteIp)
    }

    static requestId() {
        return cls.getNamespace("session")?.get("requestId");
    }

    static storeRequestId(requestId: String | undefined) {
        return cls.getNamespace("session")?.set("requestId", requestId);
    }

    static serviceId() {
        return cls.getNamespace("session")?.get("serviceId");
    }

    static storeServiceId(serviceId: String | undefined) {
        return cls.getNamespace("session")?.set("serviceId", serviceId);
    }

    static storeXForwardedFor(xForwardedFor: String | undefined) {
        return cls.getNamespace("session")?.set("xForwardedFor", xForwardedFor);
    }
    static xForwardedFor() {
        return cls.getNamespace("session")?.get("xForwardedFor");
    }

    static storePath(path: string) {
        return cls.getNamespace("session")?.set("path", path);
    }

    static path() {
        return cls.getNamespace("session")?.get("path");
    }

    static storeMethod(method: string) {
        return cls.getNamespace("session")?.set("method", method);
    }

    static method() {
        return cls.getNamespace("session")?.get("method");
    }

    static storePathName(path: string) {
        return cls.getNamespace("session")?.set("pathName", path);
    }

    static pathName() {
        return cls.getNamespace("session")?.get("pathName");
    }

    static reqDto(): SessionInfoDto {
        const namespace = cls.getNamespace('session');
        return {
            id: namespace!.get('id'),
            remoteIp: namespace!.get('remoteIp'),
        };
    }
}
