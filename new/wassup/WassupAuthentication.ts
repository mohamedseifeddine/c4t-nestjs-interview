import axios, {AxiosHeaders, AxiosRequestConfig} from 'axios';
import {axiosProxyConfig} from "./axiosProxyConfig";

export enum ValidationTimeCookie {
    FifteenMinutes = 1,
    SixMonths = 4
}

export class WassupAuthenticationError extends Error {
    public readonly responseText: any = undefined;

    constructor(
        public readonly innerError: any) {
        super();
        if (innerError.response) {
            this.responseText = innerError.response.data
        } else if (innerError.message) {
            this.responseText = innerError.message
        }
        this.message = `WassupAuthenticationError with response text ${this.responseText}`;
    }
}

export async function wassupAuthentication(
    url: string,
    email: string,
    password: string,
    validationTimeCookie: ValidationTimeCookie): Promise<string> {
   // const supervisionToken = process.env.WASSUP_SUPERVISION_TOKEN || 'token'
    const supervisionToken = 'token'
    let response: any;
    try {
        let config: AxiosRequestConfig = axiosProxyConfig(url);
        config.headers = new AxiosHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': `in_sup=${supervisionToken}`
        });
        const data = {
            'wt-email': email,
            'wt-pwd': password,
            serv: 'SDKAPI',
            'wt-cvt': validationTimeCookie,
            info: 'cooses',
            'wt-cooses': ''
        }


        console.log(config.headers)
        console.log(data)

        response = await axios.post(
            url,
            data,
            config
        );
    } catch (e: any) {
        throw new WassupAuthenticationError(e);
    }
    return response.headers['set-cookie']
        // find the first cookie that has wassup=
        .filter((s: string) => s.startsWith('wassup='))[0]
        // this cookie is something like
        .split(';')
        .filter((s: string) => s.startsWith('wassup='))[0];
}
