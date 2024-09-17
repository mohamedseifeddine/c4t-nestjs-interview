export class GeolocError extends Error {
    constructor() {
        super();
        this.message = "Your IP has been geolocated in a country that is not allowed to use the service";
        this.name = this.constructor.name;
    }
}