import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

interface JwtPayloadUser extends JwtPayload {
  id: string;
  email: string;
}

export function AuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const jwtTokenCookie = req.cookies.jwtToken;

  if (!jwtTokenCookie) {
    throw Error('UnAuthorized');
  }

  let decoded;
  try {
    decoded = jwt.verify(jwtTokenCookie, env.JWT_SECRET) as JwtPayloadUser;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or missing token' });
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
  };

  next();
}
