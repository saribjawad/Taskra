import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiErrors';
import { WorkspaceMemberRole } from '../models/workspace.model';

export interface JwtPayloadUser extends JwtPayload {
  id: string;
  email: string;
  activeWorkspace: string;
  role: WorkspaceMemberRole | null;
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
    role: decoded.role,
  };

  next();
}
