export class HttpError extends Error {
    public readonly status: number;
    public readonly mnemo: string;
    public readonly message: string;
  
    constructor(status: number, mnemo: string, message: string, description?: string) {
      super(description);
      this.status = status;
      this.mnemo = mnemo;
      this.message = message;
    }
  }