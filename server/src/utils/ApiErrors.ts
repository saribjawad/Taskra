export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string, stack?: string) {
    super();

    this.status = status;
    this.message = message;
    this.stack = stack;
  }
}
