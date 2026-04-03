import { NextFunction, Request, Response } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayloadUser } from './auth.middleware';

export function RequireVerifyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const verifyToken = req.cookies.verifyToken;

  if (!verifyToken) {
    throw new Error('Invalid verify token');
  }

  let decoded;

  try {
    decoded = jwt.verify(
      verifyToken,
      env.VERIFY_TOKEN_SECRET,
    ) as JwtPayloadUser;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or missing verify token' });
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
  };

  next();
}
