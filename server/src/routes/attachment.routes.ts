import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RequrieActiveWorkspace } from '../middlewares/requiredActiveWorkspace.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { GetPresignedUrlOfAttachment } from '../controllers/attachment.controller';

const attachmentRouter = Router();

attachmentRouter.use(AuthMiddleware);
attachmentRouter.use(RequrieActiveWorkspace);

attachmentRouter
  .route('/:attachmentId')
  .get(asyncHandler(GetPresignedUrlOfAttachment));

export default attachmentRouter;
