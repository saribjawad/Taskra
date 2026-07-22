import { NextFunction, Request, Response } from 'express';
import z, { ZodError } from 'zod';
import { ApiError } from '../utils/ApiErrors';
import logger from '../utils/logger';

export function ErrorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Handler zod errors
  if (err instanceof ZodError) {
    const flattenError = z.flattenError(err);
    const errors = Object.entries(flattenError.fieldErrors).map(
      ([field, messages]) => ({
        field,
        message: (messages as string[])?.[0] ?? 'Invalid',
      }),
    );

    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: 'Validation Error',
      errors,
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      success: false,
      message: err.message,
      errors: err.errors ?? [],
    });
  }

  console.log(err);
  logger.error(err);

  res.status(500).json({
    statusCode: 500,
    success: false,
    message: 'Internal Server Error',
    errors: [],
  });
}
