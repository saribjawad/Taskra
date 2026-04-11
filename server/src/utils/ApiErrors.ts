export class ApiError extends Error {
  statusCode: number;
  success: boolean;

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    stack?: string,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor); // if no stack capture one
    }
  }
}
