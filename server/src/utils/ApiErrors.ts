export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors: any;
  code?: string;

  constructor(
    statusCode: number,
    message = 'Something went wrong',
    errors?: any,
    isOperational = true,
    code?: string,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static badRequest(message = 'Bad request') {
    return new ApiError(400, message);
  }

  static forbidden(message = 'Forbidden request', code?: string) {
    return new ApiError(403, message, undefined, true, code);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, [], false); // not operational
  }
}
