import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { findUserById } from '../services/user.service';

export const getMe = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const { id, email, username, created_at } = await findUserById(userId);

  return res.status(200).json(
    new ApiResponse(200, 'Success', {
      id,
      email,
      username,
      created_at,
    }),
  );
};
