import { Router } from 'express';
import {
  LoginUser,
  RefreshAccessToken,
  ResendCode,
  SignUpUser,
  VerifyEmail,
} from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { RequireVerifyMiddleware } from '../middlewares/requireVerify.middleware';

const authRouter = Router();

authRouter.post('/sign-in', asyncHandler(LoginUser));
authRouter.post('/sign-up', asyncHandler(SignUpUser));
authRouter.post('/refresh-access-token', asyncHandler(RefreshAccessToken));
authRouter.patch(
  '/verify-email',
  RequireVerifyMiddleware,
  asyncHandler(VerifyEmail),
);
authRouter.get(
  '/resend-code',
  RequireVerifyMiddleware,
  asyncHandler(ResendCode),
);

export default authRouter;
