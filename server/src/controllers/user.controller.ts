import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { findUserById, updateUser } from '../services/user.service';
import { UpdateUserSchema } from '../schemas/user.schema';
import { ApiError } from '../utils/ApiErrors';

export const GetCurrentUser = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const { id, email, username, active_workspace } = await findUserById(userId);

  return res.status(200).json(
    new ApiResponse(200, 'Success', {
      id,
      email,
      username,
      active_workspace,
    }),
  );
};

export const UpdateUser = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const parsedBody = UpdateUserSchema.parse(req.body);

  const { username } = parsedBody;

  const updatedRowCount = await updateUser(userId, {
    username,
  });

  if (!updatedRowCount || updatedRowCount <= 0) {
    throw ApiError.internal('Something went wrong while updating the user');
  }

  return res.status(200).json(new ApiResponse(200, 'User updated'));
};
