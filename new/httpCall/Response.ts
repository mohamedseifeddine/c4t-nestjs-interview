import axios, { AxiosResponse, AxiosRequestConfig } from "axios";

export class MyResponse{
    static responseSize(response: AxiosResponse) {
        return parseInt((response && response.headers && response.headers['content-length']) || 0, 10);
        // Todo voir si au lieu de 0, mettre response.data.length
    }
    static responseDuration(response: AxiosResponse): number {
        const startTime = (response.config as any).startTime;
        const endTime = Date.now();
        return endTime - startTime;
    }
}
