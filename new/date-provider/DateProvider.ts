type DateProviderFunction = () => Date;

export class DateProvider {

    private static currentProvider: DateProviderFunction = () => new Date()

    static defineProviderForTest(provider: DateProviderFunction) {
        if(process.env.NODE_ENV !== 'test'){
            throw new Error('This function is only allowed in test (it changes date behaviour for the entire process)')
        }
        const lastProvider = this.currentProvider;
        this.currentProvider = provider;
        return lastProvider;
    }

    static now(): Date {
        return this.currentProvider()
    }
}
