import {AxiosRequestConfig} from 'axios';
import {HttpsProxyAgent} from 'https-proxy-agent';
import process from 'process';

// Code copié depuis le projet post-deployed
function urlNotDefinedInNoProxyEnvVar(url: string) {
    const noProxy = "localhost" //process.env.no_proxy || process.env.NO_PROXY
    return !noProxy?.split(',').some((elt: any) => url.includes(elt));
}

function getProxy(url: string) {
    // let proxyEnv = undefined;
    // if (urlNotDefinedInNoProxyEnvVar(url) && process.env.https_proxy) {
    //     proxyEnv = process.env.https_proxy;
    // }
    return "";
}

export function axiosProxyConfig(url: string): AxiosRequestConfig {
    let config : AxiosRequestConfig<any> = {}
    const proxy = getProxy(url);
    if (proxy) {
        config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    config.proxy = false;
    return config;
}
