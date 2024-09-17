import pino, {DestinationStream} from "pino";
import {SessionInfo} from "../globalMiddlewares/SessionInfo";

export class LoggerAdapter {
    protected logger?: any;
    static logStream: DestinationStream = pino.destination(1);  //pino.destination(1) = STDOUT

    protected complementaryField: (logger: any) => any = (aLogger)=>aLogger;

    set level(value: string) {
        this.logger.level = value;
    }

    constructor(constructor: Function) { //pino.destination(1) = STDOUT
        this.logger = pino({
            name: 'webxms-service-api-wampaas', // == app in melvis. keep ending by -wampaas melvis for index
            level: 'debug',
        }, LoggerAdapter.logStream).child({
            className: constructor.name,
            service_name: 'service-api'
        })
    }

    /*
    pino type Level = "fatal" | "error" | "warn" | "info" | "debug" | "trace";
     */

    debug(msg: string, ...args: any[]) {
        let loggerChild = this.loggerWithSessionInfo()
        loggerChild = this.complementaryField(loggerChild)
        loggerChild.debug(msg, ...args.map(a => LoggerAdapter.stringify(a)))
    }

    info(msg: string, ...args: any[]) {
        let loggerChild = this.loggerWithSessionInfo()
        loggerChild = this.complementaryField(loggerChild)
        loggerChild.info(msg, ...args.map(a => LoggerAdapter.stringify(a)))
    }

    warn(msg: string, ...args: any[]) {
        let loggerChild = this.loggerWithSessionInfo()
        loggerChild = this.complementaryField(loggerChild)
        loggerChild.warn(msg, ...args.map(a => LoggerAdapter.stringify(a)))
    }

    error(msg: string, ...args: any[]) {
        let loggerChild = this.loggerWithSessionInfo()
        loggerChild = this.complementaryField(loggerChild)
        loggerChild.error(msg, ...args.map(a => LoggerAdapter.stringify(a)))
    }

    private loggerWithSessionInfo() {
        return this.logger.child(
            {
                reqId: SessionInfo.requestId(),
                remoteIp: SessionInfo.remoteIp(),
                serviceId: SessionInfo.serviceId(),
                path: SessionInfo.path(),
                pathName: SessionInfo.pathName(),
                method: SessionInfo.method()
            });

        // path  full path no anonymous users/3535/conversation/123445/
        // pathName anonymous path users/{userId}/conversation/{conversationId}
    }

    private static stringify(a: any) {
        if (a instanceof Error && (a as any).toJSON === undefined) {
            return `${LoggerAdapter.displayTypeIfNotNative(a)}${a.stack}`;
        }
        return `${LoggerAdapter.displayTypeIfNotNative(a)}${JSON.stringify(a)}`
    }

    private static displayTypeIfNotNative(error: Error) {
        if (error == undefined){
            return '';
        }
        if(! ['String', 'Error', 'Object', 'Number'].includes(error.constructor.name))
            return `${error.constructor.name} `
        return '';
    }

    protected eraseComplementaryField() {
        this.complementaryField = (logger:any) => logger
    }

}
