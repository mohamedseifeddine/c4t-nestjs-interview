import {LogsStreamInMemory} from "./LogsStreamInMemory";
import {DateSimulator} from "../date-provider/DateSimulator";
import {PartnerLoggerAdapter} from "./PartnerLoggerAdapter";
import {LoggerAdapter} from "./LoggerAdapter";
import {HttpPartnerInfoForLog} from "./HttpPartnerInfoForLog";
import {HttpPartnerRequestInfoForLog} from "./HttpPartnerRequestInfoForLog";
import {HttpPartnerResponseInfoForLog} from "./HttpPartnerResponseInfoForLog";
import {SessionInfo} from "../globalMiddlewares/SessionInfo";
import * as cls from "cls-hooked";

describe('PartnerLoggerAdapter', () => {

    let logStream: LogsStreamInMemory;
    let partnerLogger: PartnerLoggerAdapter;
    let dateSimulator: DateSimulator;

    const geolocPartnerInfoForLog = new HttpPartnerInfoForLog('geoloc', 'GET', 'geolocUrl', 5000)
    const httpPartnerRequestInfoForLog = new HttpPartnerRequestInfoForLog({'aHeader': 'aHeaderValue'}, {ip: '1.2.3.4'});
    const partnerResponseInfoForLogOk =
        new HttpPartnerResponseInfoForLog(200, '{response:cool}', 1234)
    const partnerResponseInfoForLogError =
        new HttpPartnerResponseInfoForLog(400, 'some error append', 1234)

    beforeEach(() => {
        logStream = new LogsStreamInMemory();
        LoggerAdapter.logStream = logStream
        partnerLogger = new PartnerLoggerAdapter(PartnerLoggerAdapter, geolocPartnerInfoForLog);
        dateSimulator = new DateSimulator();
    })

    afterEach(() => {
        dateSimulator.restore()
    })

    test('beforeCall keep serviceId', ()=>{
        cls.createNamespace('session').run(() => {
            SessionInfo.storeServiceId('aService')

            partnerLogger.beforeCall(httpPartnerRequestInfoForLog)
        })
        expect(logStream.logs[0].serviceId).toEqual('aService')
    })

    test('beforeCall on http partner log http partner details', () => {

        partnerLogger.beforeCall(httpPartnerRequestInfoForLog)

        expect(logStream.logs[0].log_type).toEqual('partner')
        expect(logStream.logs[0].partner_id).toEqual('geoloc')
        expect(logStream.logs[0].partnerReq.method).toEqual('GET')
        expect(logStream.logs[0].partnerReq.url).toEqual('geolocUrl')
        expect(logStream.logs[0].partnerReq.details).toEqual({ip: '1.2.3.4'})
        expect(logStream.logs[0].partnerReq.headers).toEqual({"aHeader": "aHeaderValue"})
        expect(logStream.logs[0].partnerReq.timeout).toEqual(5000)
    })

    test('beforeCall on http partner log headers', () => {

        partnerLogger.beforeCall(httpPartnerRequestInfoForLog)

        expect(logStream.logs[0].partnerReq.headers).toEqual({'aHeader': 'aHeaderValue'})
    })

    test('beforeCall log msg "Call <partnerName>"', () => {

        partnerLogger.beforeCall(httpPartnerRequestInfoForLog)

        expect(logStream.logs[0].msg).toEqual('Call geoloc')
    })

    test('beforeCall log at debug level"', () => {

        partnerLogger.beforeCall(httpPartnerRequestInfoForLog)

        expect(logStream.logs[0].level).toEqual(20)
    })

    test('afterCall keep serviceId', ()=>{
        cls.createNamespace('session').run(() => {
            SessionInfo.storeServiceId('aService')
            partnerLogger.beforeCall(httpPartnerRequestInfoForLog);

            partnerLogger.afterCall(partnerResponseInfoForLogOk)
        })
        expect(logStream.logs[1].serviceId).toEqual('aService')
    })

    test('afterCall log some partner details', () => {
        partnerLogger.beforeCall(httpPartnerRequestInfoForLog);

        partnerLogger.afterCall(partnerResponseInfoForLogOk)

        expect(logStream.logs[1].log_type).toEqual('partner')
        expect(logStream.logs[1].partner_id).toEqual('geoloc')
        expect(logStream.logs[1].partnerReq.method).toEqual('GET')
        expect(logStream.logs[1].partnerReq.url).toEqual('geolocUrl')
        expect(logStream.logs[1].partnerReq.status_code).toEqual(200)
        expect(logStream.logs[1].partnerReq.status).toEqual('OK')
        expect(logStream.logs[1].partnerReq.resp).toEqual('{response:cool}')
        expect(logStream.logs[1].partnerReq.response_size).toEqual(1234)
        expect(logStream.logs[1].partnerReq.response_time).toEqual(0)
        expect(logStream.logs[1].partnerReq.details).toBeUndefined()
        expect(logStream.logs[1].partnerReq.timeout).toBeUndefined()
    })

    test('afterCall log msg "<partnerName> response"', () => {
        partnerLogger.beforeCall(httpPartnerRequestInfoForLog);

        partnerLogger.afterCall(partnerResponseInfoForLogOk)

        expect(logStream.logs[1].msg).toEqual('geoloc response')
    })

    test('afterCall log at info level"', () => {
        partnerLogger.beforeCall(httpPartnerRequestInfoForLog);

        partnerLogger.afterCall(partnerResponseInfoForLogOk)

        expect(logStream.logs[1].level).toEqual(30)
    })

    test('afterCall throw error when beforeCall was not call before', () => {
        try {
            partnerLogger.afterCall(partnerResponseInfoForLogOk)
        } catch (e) {
            expect(e).toEqual(new Error('Implementation error, beforeCall must be call before afterCall'))
        }
    })

    test('afterCall response_time is the time difference between beforeCall and afterCall', () => {
        dateSimulator.dateIs('2024-02-08T13:49:00.000Z')
        partnerLogger.beforeCall(httpPartnerRequestInfoForLog);
        dateSimulator.dateIs('2024-02-08T13:49:01.000Z')

        partnerLogger.afterCall(partnerResponseInfoForLogOk)

        expect(logStream.logs[1].partnerReq.response_time).toEqual(1000)
    })

    test('errorOnCall keep serviceId', ()=>{
        cls.createNamespace('session').run(() => {
            SessionInfo.storeServiceId('aService')
            partnerLogger.beforeCall(httpPartnerRequestInfoForLog);

            partnerLogger.errorOnCall(partnerResponseInfoForLogError)
        })
        expect(logStream.logs[1].serviceId).toEqual('aService')
    })

    test('errorOnCall log some partner details', () => {
        partnerLogger.beforeCall(httpPartnerRequestInfoForLog);

        partnerLogger.errorOnCall(partnerResponseInfoForLogError)

        expect(logStream.logs[1].log_type).toEqual('partner')
        expect(logStream.logs[1].partner_id).toEqual('geoloc')
        expect(logStream.logs[1].partnerReq.method).toEqual('GET')
        expect(logStream.logs[1].partnerReq.url).toEqual('geolocUrl')
        expect(logStream.logs[1].partnerReq.status_code).toEqual(400)
        expect(logStream.logs[1].partnerReq.status).toEqual('KO')
        expect(logStream.logs[1].partnerReq.resp).toEqual('some error append')
        expect(logStream.logs[1].partnerReq.response_size).toEqual(1234)
        expect(logStream.logs[1].partnerReq.response_time).toEqual(0)
        expect(logStream.logs[1].partnerReq.details).toBeUndefined()
        expect(logStream.logs[1].partnerReq.timeout).toBeUndefined()
    })

    test('errorOnCall log error msg with error response"', () => {
        partnerLogger.beforeCall(httpPartnerRequestInfoForLog);

        partnerLogger.errorOnCall(partnerResponseInfoForLogError)

        expect(logStream.logs[1].msg).toEqual('geoloc error : some error append')
    })

    test('errorOnCall log at info level"', () => {
        partnerLogger.beforeCall(httpPartnerRequestInfoForLog);

        partnerLogger.errorOnCall(partnerResponseInfoForLogError)

        expect(logStream.logs[1].level).toEqual(50)
    })

    test('errorOnCall throw error when beforeCall was not call before', () => {
        try {
            partnerLogger.errorOnCall(partnerResponseInfoForLogError)
        } catch (e) {
            expect(e).toEqual(new Error('Implementation error, beforeCall must be call before afterCall'))
        }
    })

    test('errorOnCall response_time is the time difference between beforeCall and afterCall', () => {
        dateSimulator.dateIs('2024-02-08T13:49:00.000Z')
        partnerLogger.beforeCall(httpPartnerRequestInfoForLog);
        dateSimulator.dateIs('2024-02-08T13:49:01.000Z')

        partnerLogger.errorOnCall(partnerResponseInfoForLogError)

        expect(logStream.logs[1].partnerReq.response_time).toEqual(1000)
    })

})
