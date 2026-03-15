import { NextFunction, Request, Response } from 'express';
import z, { ZodError } from 'zod';

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

  res.send({
    message: 'Error',
    errors: err,
  });
}
