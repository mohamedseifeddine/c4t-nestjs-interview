export interface DataBaseBuilder<T> {
    build(): Promise<T>

    close(): Promise<void>
}
