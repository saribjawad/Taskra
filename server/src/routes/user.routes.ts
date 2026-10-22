import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { GetCurrentUser, UpdateUser } from '../controllers/user.controller';
import { RequiredRoles } from '../middlewares/requiredRoles.middleware';

const userRouter = Router();
userRouter.use(AuthMiddleware);

userRouter
  .route('/me')
  .get(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(GetCurrentUser),
  )
  .patch(
    RequiredRoles(['owner', 'admin', 'member', 'viewer']),
    asyncHandler(UpdateUser),
  );

export default userRouter;
