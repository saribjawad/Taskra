import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiErrors';

export function RequrieActiveWorkspace(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user.activeWorkspace) {
    throw ApiError.badRequest('No active workspace selected');
  }

  next();
}
