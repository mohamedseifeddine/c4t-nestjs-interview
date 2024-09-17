export class WassupUser {
    constructor(
        public readonly uid: string,
        public readonly uit: number,
        public readonly puid: string, // primaire
        public readonly spr: number,
        public readonly sau: number,
        public readonly ulo: string,
    ) {

    }
}
