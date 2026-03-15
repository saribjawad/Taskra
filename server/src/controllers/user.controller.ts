import { Request, Response } from 'express';
import { SignUpUserSchema } from '../schemas/user.schema';
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
} from '../services/user.service';
import { hashPassword } from '../utils/hashPassword';

const SignUpUser = async (req: Request, res: Response) => {
  try {
    // Validate incoming body
    const parsedBody = SignUpUserSchema.parse(req.body);

    const { username, password, email } = parsedBody;

    // Check duplicate user
    const userWithUsernameExist = await findUserByUsername(username);
    const userWithEmailExist = await findUserByEmail(email);

    if (userWithUsernameExist) {
      return res.send({
        message: 'failed',
        body: 'Username already taken',
      });
    }

    if (userWithEmailExist) {
      return res.send({
        message: 'failed',
        body: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const createdUser = await createUser(username, email, hashedPassword);

    res.send(createdUser);
  } catch (error) {
    throw error;
  }
};

export { SignUpUser };
