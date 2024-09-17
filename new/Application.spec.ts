import request from 'supertest'
import {Application} from "./Application";
import {Express} from "express";


describe('Application', () => {

    let application: Application;
    let app: Express;

    beforeAll(async () => {
        application = new Application();
        app = await application.start();

    })

    afterAll(async () => {
        await new Promise<void>((resolve) => {
            application.stop(resolve);
        })
    })

    test("Application works", async () => {
        const response = await request(app).get('/health').set('x-client-ip', "193.253.78.1")
        expect(response.status).toBe(200)
        expect(JSON.parse(response.text).Response).toBe("OK")

    })

    test("database works", async () => {
        const response = await request(app).get('/health/database').set('x-client-ip', "193.253.78.1")
        expect(response.status).toBe(200)
        expect(JSON.parse(response.text).Response.id).toBe(20)
    })

    test("geoloc works", async () => {
        const response = await request(app).get('/health/geoloc').set('x-client-ip', "193.253.78.1")
        expect(response.status).toBe(200)
    })
})
