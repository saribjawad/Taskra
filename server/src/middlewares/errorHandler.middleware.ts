import { NextFunction, Request, Response } from 'express';
import z, { ZodError } from 'zod';
import { ApiError } from '../utils/ApiErrors';
import { env } from '../config/env';

export function ErrorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Handler zod errors
  if (err instanceof ZodError) {
    const flattenError = z.flattenError(err);

    return res.send({
      message: 'Validation error',
      errors: {
        form: flattenError.formErrors,
        fields: flattenError.fieldErrors,
      },
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).send({
      message: err.message,
      stack: env.APP_ENV === 'DEV' ? err.stack : '',
    });
  }

  // TODO: Log the unexpected error
  res.send({
    message: 'Error',
    errors: err.message || 'An unexpected error occurred!',
  });
}
