import { Request, Response } from 'express';
import {
  LoginUserSchema,
  SignUpUserSchema,
  VerifyEmailSchema,
} from '../schemas/auth.schema';
import type { StringValue } from 'ms';
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  saveRefreshToken,
  updateUser,
} from '../services/user.service';
import {
  createVerification,
  getVerification,
} from '../services/verification.service';
import { comparePassoword, hashPassword } from '../utils/bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayloadUser } from '../middlewares/auth.middleware';
import { sendVerificationEmail } from '../lib/resend';
import moment from 'moment';

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

    if (!user.is_verified) {
      // TODO: send the verification code if prev one is expired
      throw new Error('User is not verified');
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

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(user.id, user.email);

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

    const hashedPassword = await hashPassword(password);
    const createdUser = await createUser(username, email, hashedPassword);

    // Generate verification code
    const verificationCode = generateCode();

    const oldDateObj = new Date();
    const expiryDate = moment(oldDateObj).add(10, 'm').toDate();

    // Save verification code in DB, and send to mail
    await createVerification(verificationCode, createdUser.id, expiryDate);
    await sendVerificationEmail(verificationCode);

    const accessToken = generateAccessToken(
      createdUser.id,
      createdUser.email,
      '60000ms',
    );

    res.cookie('verifyToken', accessToken);
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

  const accessToken = generateAccessToken(user.id, user.email);
  const newRefreshToken = await generateRefreshToken(user.id, user.email);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
  });
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    path: '/api/v1/refresh-access-token',
  });

  res.send('refreshed token');
};

export const VerifyEmail = async (req: Request, res: Response) => {
  const user = req.user;

  const parsedBody = VerifyEmailSchema.parse(req.body);
  const { code } = parsedBody;

  const verificationCode = await getVerification(code, user.id);

  if (!verificationCode || verificationCode.code !== code) {
    throw new Error('Invalid code');
  }

  // Check for expiry
  if (verificationCode.expires_at < Date.now()) {
    throw new Error('Verification code has been expired, request another');
  }

  // Mark user as verified
  await updateUser(user.id, {
    is_verified: true,
  });

  res.clearCookie('verifyToken');
  res.send('Email verified');
};

// ===============================================
// Helpers
// ===============================================

async function generateAccessToken(
  id: string,
  email: string,
  expiresIn: StringValue = '5000ms',
) {
  // Create a access and refresh token
  const accessToken = jwt.sign({ id, email }, env.JWT_SECRET, {
    expiresIn,
  });

  return accessToken;
}

async function generateRefreshToken(id: string, email: string) {
  const refreshToken = jwt.sign({ id: id, email: email }, env.REFRESH_SECRET, {
    expiresIn: '7d',
  });

  // Save refresh token in DB
  await saveRefreshToken(email, refreshToken);

  return refreshToken;
}

function generateCode() {
  let numbers = [];

  for (let i = 0; i < 6; i++) {
    const code = Math.floor(Math.random() * 9);
    numbers.push(code);
  }

  return numbers.join('');
}
