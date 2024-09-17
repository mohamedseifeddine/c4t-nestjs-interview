import {DestinationStream} from "pino";

export class LogsStreamInMemory implements DestinationStream {
    public logs = new Array<any>();

    write(msg: string): void {
        this.logs.push(JSON.parse(msg))
    }
}
