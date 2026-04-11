export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors: any;

  constructor(
    statusCode: number,
    message = 'Something went wrong',
    errors?: any,
    isOperational = true,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static badRequest(message = 'Bad request', errors: any) {
    return new ApiError(400, message, errors);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, [], false); // not operational
  }
}
