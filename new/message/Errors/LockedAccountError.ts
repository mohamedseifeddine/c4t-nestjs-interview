

export class LockedAccountError extends Error {
    details: { lockCode: number };

    constructor( lockCode: number , message: string) {
        super(message);
        this.name = 'LockedAccountError';
        this.details = {lockCode: lockCode};
    }
}
