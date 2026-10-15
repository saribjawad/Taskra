import { NextFunction, Request, Response } from 'express';
import z, { ZodError } from 'zod';
import { ApiError } from '../utils/ApiErrors';
import logger from '../utils/logger';
import { MulterError } from 'multer';

export function ErrorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Handle Mutler Errors
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'images') {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: 'Cannot add more than 3 images',
      });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'pdf') {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: 'Cannot add more than 1 PDF',
      });
    } else if (
      err.code === 'LIMIT_UNEXPECTED_FILE' &&
      err.field === 'document'
    ) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: 'Cannot add more than 1 document',
      });
    }
  }

  // Handler zod errors
  if (err instanceof ZodError) {
    const flattenError = z.flattenError(err);
    const errors = Object.entries(flattenError.fieldErrors).map(
      ([field, messages]) => ({
        field,
        message: (messages as string[])?.[0] ?? 'Invalid',
      }),
    );
    errors.push(
      ...flattenError.formErrors.map((message) => ({ field: 'form', message })),
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

  logger.error(err);

  res.status(500).json({
    statusCode: 500,
    success: false,
    message: 'Internal Server Error',
    errors: [],
  });
}
