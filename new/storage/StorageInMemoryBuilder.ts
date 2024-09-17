import {DataBaseBuilder} from "./DataBaseBuilder";

export class StorageInMemoryBuilder<T> implements DataBaseBuilder<T> {
    constructor(private delegateCreate: () => T) {
    }

    async build(): Promise<T> {
        return this.delegateCreate()
    }

    async close() {

    }
}
