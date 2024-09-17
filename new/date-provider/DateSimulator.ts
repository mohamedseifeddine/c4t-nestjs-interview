import { DateProvider } from './DateProvider';

export class DateSimulator {
    private currentDate = new Date();
    private lastProvider: () => Date;

    constructor() {
        this.lastProvider = DateProvider.defineProviderForTest(() => this.currentDate);
    }

    restore() {
        DateProvider.defineProviderForTest(this.lastProvider);
    }

    itIs(time: string) {
        this.currentDate = new Date(`${this.currentDate.toISOString().slice(0, 10)}T${time}`);
    }

    dateIs(date: string) {
        this.currentDate = new Date(date)
    }
}
