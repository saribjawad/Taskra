import { NextFunction, Request, Response } from 'express';
import { WorkspaceMemberRole } from '../models/workspace.model';
import { ApiError } from '../utils/ApiErrors';

export function RequiredRoles(roles: WorkspaceMemberRole[]) {
  return function (req: Request, _res: Response, next: NextFunction) {
    const userRole = req.user.role;

    if (userRole && roles.includes(userRole)) {
      next();
    } else {
      throw ApiError.forbidden(
        'You do not have permission to perform this action',
      );
    }
  };
}
