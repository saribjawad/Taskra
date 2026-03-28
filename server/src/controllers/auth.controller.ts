import { Request, Response } from 'express';
import { LoginUserSchema, SignUpUserSchema } from '../schemas/auth.schema';
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  saveRefreshToken,
} from '../services/user.service';
import { comparePassoword, hashPassword } from '../utils/bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayloadUser } from '../middlewares/auth.middleware';

// ===============================================
// Controllers
// ===============================================

export const LoginUser = async (req: Request, res: Response) => {
  try {
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

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user.id,
      user.email,
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/api/v1/refresh-access-token',
    });

    res.send({
      message: 'Logged in',
    });
  } catch (error) {
    throw error;
  }
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

export const RefreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, env.REFRESH_SECRET) as JwtPayloadUser;
  } catch (err) {
    console.log(err);
    throw new Error('Invalid or expired token');
  }

  const user = await findUserByEmail(decoded.email);

  if (user.refresh_token !== refreshToken) {
    throw new Error('Invalid or expired token');
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshToken(user.id, user.email);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
  });
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    path: '/api/v1/refresh-access-token',
  });

  res.send('refreshed token');
};

// ===============================================
// Helpers
// ===============================================

async function generateAccessAndRefreshToken(id: string, email: string) {
  // Create a access and refresh token
  const accessToken = jwt.sign({ id: id, email: email }, env.JWT_SECRET, {
    expiresIn: '5000ms',
  });
  const refreshToken = jwt.sign({ id: id, email: email }, env.REFRESH_SECRET, {
    expiresIn: '7d',
  });

  // Save refresh token in DB
  await saveRefreshToken(email, refreshToken);

  return {
    accessToken,
    refreshToken,
  };
}
