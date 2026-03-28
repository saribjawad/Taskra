import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayloadUser extends JwtPayload {
  id: string;
  email: string;
}

export function AuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    throw Error('UnAuthorized');
  }

  let decoded;
  try {
    decoded = jwt.verify(accessToken, env.JWT_SECRET) as JwtPayloadUser;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or missing token' });
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
  };

  next();
}
