export abstract class TemplateMongoClientWithLog {
    protected abstract beforeCall(method: string): void;
    protected abstract afterCall(method: string): void;
    protected abstract errorOnCall(method: string, error: string): void;

    protected async executeWithLogging(method: string, action: () => Promise<any>): Promise<any> {
        this.beforeCall(method);
        try {
            const result = await action();
            this.afterCall(method);
            return result;
        } catch (error: any) {
            this.errorOnCall(method, error.toString());
            throw error;
        }
    }
}
