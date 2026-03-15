import { Request, Response } from 'express';
import { LoginUserSchema, SignUpUserSchema } from '../schemas/user.schema';
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
} from '../services/user.service';
import { comparePassoword, hashPassword } from '../utils/bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const LoginUser = async (req: Request, res: Response) => {
  const parsedBody = LoginUserSchema.parse(req.body);

  const { email, password } = parsedBody;

  // Check credientials
  const user = await findUserByEmail(email);
  if (!user) {
    return res.send({
      message: 'failed',
      body: 'Invalid credentials',
    });
  }

  const isValidPassword = await comparePassoword(
    password,
    user.hashed_password,
  );
  if (!isValidPassword) {
    return res.send({
      message: 'failed',
      body: 'Invalid credentials',
    });
  }

  // Create a JWT token
  const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET);
  res.cookie('jwtToken', token, {
    httpOnly: true,
  });

  res.send({
    message: 'Logged in',
  });
};

export const SignUpUser = async (req: Request, res: Response) => {
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
