import GeolocMiddleware from './GeolocMiddleware';
import express, {Express} from "express";
import {FormatRequestMiddleware} from "../globalMiddlewares/FormatRequestMiddleware";
import request from "supertest";
import {GeolocAdapterInMemory} from "./GeolocAdapterInMemory";


describe('GeolocMiddleware', () => {

    let app: Express;
    let geolocAdapterInMemory: GeolocAdapterInMemory;

    beforeEach(() => {
        app = express();
        app.use(new FormatRequestMiddleware().middleware)
        geolocAdapterInMemory = new GeolocAdapterInMemory();
        app.use(new GeolocMiddleware(geolocAdapterInMemory).middleware())
        app.get('/', (req, res) => {
            res.sendStatus(200);
        });
        app.get('/health', (req, res) => {
            res.sendStatus(200);
        });
    })

    test('throw geoloc error when remoteIp is not from an allow country', async () => {
        const remoteIp = '1.2.3.4'

        const res = await request(app).get('/').set('x-client-ip', remoteIp);

        expect(res.status).toBe(403);
        expect(res.body.mnemo).toBe('FORBIDDEN_GEOLOC_COUNTRY');//mnemo
        expect(res.body.message).toBe('Your IP has been geolocated in a country that is not allowed to use the service');//message
    })

    test('allow access when IP is in the whitelist', async () => {

        const response = await request(app).get('/').set('x-client-ip', "109.166.219.218");

        expect(response.status).toEqual(200);
    });

    test('allow access when path is health', async () => {

        const response = await request(app).get('/health').set('x-client-ip', "1.2.3.4");

        expect(response.status).toEqual(200);
    });

    test('allow access when IP is from an allow country', async () => {
        const response = await request(app).get('/').set('x-client-ip', "193.166.219.218");

        expect(response.status).toEqual(200);
    });

});
