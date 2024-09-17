import MongoAdapter from "../storage/MongoAdapter";
import { DatabaseConfigBuilder } from "../storage/DatabaseConfigBuilder";
import mongoose from "mongoose";
import GeolocAdapter from "../Geoloc/GeolocAdapter";

export default class HealthService {
    static status(): string {
        return 'OK';
    }

    static async databaseStatus() {
        const mongoClient = await MongoAdapter.connectToMongoWithMongoose(DatabaseConfigBuilder.loadConfig());

        const healthCheckDatabase = mongoose.model('healthCheckDatabase', new mongoose.Schema({ id: Number }));

        const id = 20;

        let existingId = await healthCheckDatabase.findOne({ id });

        if (!existingId) {
            await healthCheckDatabase.create({ id });

            existingId = await healthCheckDatabase.findOne({ id });
        }

        mongoClient.connection?.close();
        return existingId;
    }

    static async geolocStatus() {
        const country = await new GeolocAdapter().getCountryForIp('193.253.78.1')
        if(country !== 'FR'){
            throw new Error('Geoloc not working !!!')
        }
        return country
    }
}
