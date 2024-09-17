import pino from "pino";
import {SessionInfo} from "../globalMiddlewares/SessionInfo";
import * as cls from "cls-hooked";
import {LoggerAdapter} from "./LoggerAdapter";
import {LogsStreamInMemory} from "./LogsStreamInMemory";

class CustomErrorWithoutJson extends Error {
    constructor() {
        super('a custom error without json');
    }
}
class CustomErrorWithJson extends Error {
    toJSON() {
        return {message: 'inner message of custom error'}
    }
}

function getLevelNumberForLevel(levelMatching: string) {
    return Number(Object.entries(pino.levels["labels"])
        .filter(level => level[1] === levelMatching)
        .map(level => level[0])[0]);
}

declare global {
    namespace jest {
        interface Matchers<R> {
            toStartWith(start: string): R;
        }
    }
}

function importStringMatcher() {
    expect.extend({
        toStartWith(received: string, expected: string) {
            expect(received.substring(0, expected.length)).toEqual(expected);
            return {
                message: () => ``,
                pass: true
            }
        }
    });
}

importStringMatcher();

describe('LoggerAdapter', () => {

    let logStream: LogsStreamInMemory;
    let logger: LoggerAdapter;

    function getLoggerMethodLevelInfo(msg: string, ...args: any[]) {
        return logger.info(msg, ...args)
    }

    function getLoggerMethodLevelDebug(msg: string, ...args: any[]) {
        return logger.debug(msg, ...args)
    }

    function getLoggerMethodLevelWarn(msg: string, ...args: any[]) {
        return logger.warn(msg, ...args)
    }

    function getLoggerMethodLevelError(msg: string, ...args: any[]) {
        return logger.error(msg, ...args)
    }

    beforeEach(() => {
        logStream = new LogsStreamInMemory();
        LoggerAdapter.logStream = logStream;
        logger = new LoggerAdapter(LoggerAdapter);
    })

    describe.each([
        ['debug', getLoggerMethodLevelDebug],
        ['info', getLoggerMethodLevelInfo],
        ['warn', getLoggerMethodLevelWarn],
        ['error', getLoggerMethodLevelError],
    ])
    ('%s', (logLevel, loggerMethod)=>{
        test(`log on ${logLevel} level`, () => {
            loggerMethod('hello')

            expect(logStream.logs[0].msg).toEqual('hello');
            expect(logStream.logs[0].level).toEqual(getLevelNumberForLevel(logLevel))
        })

        test('log undefined string when argument is not defined', () => {
            loggerMethod('exemple %s', undefined);

            expect(logStream.logs[0].msg).toEqual(`exemple undefined`);
        });

        test('format message parameter with number', () => {

            loggerMethod("test %s", 123);

            expect(logStream.logs[0].msg).toEqual(`test 123`);
        });

        test('format message parameter with json stringify', () => {
            const anObject = {name: 'custom object'};

            loggerMethod("test %s", anObject);

            expect(logStream.logs[0].msg).toEqual(`test ${JSON.stringify(anObject)}`);
        });

        test('log with reqId', () => {
            cls.createNamespace('session').run(() => {
                SessionInfo.storeRequestId('1234')

                loggerMethod('hello')

            })
            expect(logStream.logs[0].reqId).toEqual('1234')
        })

        test('log with remoteIp', () => {
            cls.createNamespace('session').run(() => {
                SessionInfo.storeRemoteIp('1.2.3.4')

                loggerMethod('hello')

            })
            expect(logStream.logs[0].remoteIp).toEqual('1.2.3.4')
        })

        test('log with serviceId', () => {
            cls.createNamespace('session').run(() => {
                SessionInfo.storeServiceId('aService')

                loggerMethod('hello')

            })
            expect(logStream.logs[0].serviceId).toEqual('aService')
        })

        test('log with method', () => {
            cls.createNamespace('session').run(() => {
                SessionInfo.storeMethod('POST')

                loggerMethod('hello')

            })
            expect(logStream.logs[0].method).toEqual('POST')
        })

        test('log with path', () => {
            cls.createNamespace('session').run(() => {
                SessionInfo.storePath('/truc/bidule')

                loggerMethod('hello')

            })
            expect(logStream.logs[0].path).toEqual('/truc/bidule')
        })

        test('log with pathname', () => {
            cls.createNamespace('session').run(() => {
                SessionInfo.storePathName('/truc/{trucId}/bidule')

                loggerMethod('hello')

            })
            expect(logStream.logs[0].pathName).toEqual('/truc/{trucId}/bidule')
        })
    })

    test('log with serviceId, className and service_name', () => {
        cls.createNamespace('session').run(() => {
            SessionInfo.storeServiceId('aService')

            logger.info('hello')

        })
        expect(logStream.logs[0].serviceId).toEqual('aService')
        expect(logStream.logs[0].className).toEqual('LoggerAdapter')
        expect(logStream.logs[0].service_name).toEqual('service-api')
    })

    test('debug log are not visible if the logger level is info', ()=>{
        logger.level = 'info'

        logger.debug('a debug message')

        expect(logStream.logs.length).toEqual(0)
    })

    test('debug log are visible if the logger level is debug', ()=>{
        logger.level = 'debug'

        logger.debug('a debug message')

        expect(logStream.logs[0].msg).toEqual('a debug message')
    })

    test('info log are visible if the logger level is debug', ()=>{
        logger.level = 'debug'

        logger.info('a debug message')

        expect(logStream.logs[0].msg).toEqual('a debug message')
    })

    test('log error when throw stacked Error', () => {
        const error = new Error('error for test');
        try {
            throw error;
        } catch (err) {
            logger.error('an error with stack trace %s', err);
        }

        expect(logStream.logs[0].msg).toStartWith('an error with stack trace Error: error for test');
        expect(logStream.logs[0].msg).toContain(error.stack);
    });

    test('log error when throw string', () => {
        const error = 'error for test';
        try {
            throw error;
        } catch (error) {
            logger.error('an error with stack trace %s', error);
        }

        expect(logStream.logs[0].msg).toStartWith(`an error with stack trace "error for test"`);
    });

    test('log error when throw custom object', () => {
        const error = {msg: 'error for test'};
        try {
            throw error;
        } catch (error) {
            logger.error('an error with stack trace %s', error);
        }

        expect(logStream.logs[0].msg).toContain('error for test');
    });

    test('log error when custom error without json trace error type name', () => {
        const error = new CustomErrorWithoutJson()
        try {
            throw error;
        } catch (error) {
            logger.error('a custom error without json %s', error);
        }

        expect(logStream.logs[0].msg).toStartWith('a custom error without json CustomErrorWithoutJson');
    });

    test('log custom object with stack member', () => {
        const nimp = {
            stack: [{id: 'etape 1'},
                {id: 'etape 2'}]
        };
        logger.error('an error with stack trace %s', nimp);

        expect(logStream.logs[0].msg).toEqual(`an error with stack trace {"stack":[{"id":"etape 1"},{"id":"etape 2"}]}`);
    });

    test('log error that already have toJSON methods', () => {
        const customError = new CustomErrorWithJson();
        logger.error('a custom error %s', customError);

        expect(logStream.logs[0].msg).toEqual(`a custom error CustomErrorWithJson {"message":"inner message of custom error"}`);

    });

})
