export class GeolocConfig {
    constructor(
        public readonly url: string,
        public readonly user: string,
        public readonly password: string,
        public readonly proxy?: string) {
    }

}
