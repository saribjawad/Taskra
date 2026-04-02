import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayloadUser } from './auth.middleware';

export function RequireVerifyMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const verifyToken = req.cookies.verifyToken;

  if (!verifyToken) {
    throw new Error('Invalid verify token');
  }

  const decodedVerifyToken = jwt.verify(
    verifyToken,
    env.VERIFY_TOKEN_SECRET,
  ) as JwtPayloadUser;

  if (!decodedVerifyToken) {
    throw new Error('Your session has been expired');
  }

  req.user = decodedVerifyToken;

  next();
}
