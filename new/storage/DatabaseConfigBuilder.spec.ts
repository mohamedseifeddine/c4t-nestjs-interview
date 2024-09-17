import {DatabaseConfigBuilder} from "./DatabaseConfigBuilder";
import * as devEnv from '../cloudfoundry/sample/devEnv.json'
import * as qualifEnv from '../cloudfoundry/sample/qualifEnv.json'
import * as pprodEnv from '../cloudfoundry/sample/pprodEnv.json'

describe('DatabaseConfigBuilder', ()=>{

    test('load dev conf', ()=>{
        const dbUri =  DatabaseConfigBuilder.parseDevConfig(JSON.stringify(devEnv.VCAP_SERVICES));

        expect(dbUri).toEqual("mongodb://aDataBaseUserName:aDataBasePassword@10.99.227.63:27017/aDataBaseId?tlsInsecure=true&ssl=true");
    })

    test('load qualif conf', ()=>{
        const dbUri =  DatabaseConfigBuilder.parseQualifConfig(JSON.stringify(qualifEnv.VCAP_SERVICES));

        expect(dbUri).toEqual("mongodb://aUser:aPassword@10.98.229.42:1106/aDatabase?tlsInsecure=true&ssl=true");
    })

    test('load preprod conf', ()=>{
        const dbUri =  DatabaseConfigBuilder.parsePreprodConfig(JSON.stringify(pprodEnv.VCAP_SERVICES));

        expect(dbUri).toEqual("mongodb://aDataBaseUserName:aDataBasePwd@10.98.229.122:27017/aDatabaseName?tlsInsecure=true&ssl=true");
    })
})
