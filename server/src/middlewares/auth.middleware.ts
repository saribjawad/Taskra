import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiErrors';

export interface JwtPayloadUser extends JwtPayload {
  id: string;
  email: string;
  active_workspace: string;
  purpose?: string;
}

export function AuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    throw ApiError.unauthorized();
  }

  let decoded;
  try {
    decoded = jwt.verify(accessToken, env.JWT_SECRET) as JwtPayloadUser;
  } catch (err) {
    throw ApiError.unauthorized('Invalid or missing token');
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
    activeWorkspace: decoded.activeWorkspace,
  };

  next();
}
