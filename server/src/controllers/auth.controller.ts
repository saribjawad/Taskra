import { Request, Response } from 'express';
import {
  ForgotPasswordPayloadSchema,
  LoginUserSchema,
  ResendCodeSchema,
  ResetPasswordPayloadSchema,
  SignUpUserSchema,
  VerifyEmailSchema,
} from '../schemas/auth.schema';
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  saveRefreshToken,
  updateUser,
} from '../services/user.service';
import {
  createVerification,
  deleteUserVerificationsCode,
  getVerification,
} from '../services/verification.service';
import { comparePassoword, hashPassword } from '../utils/bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayloadUser } from '../middlewares/auth.middleware';
import {
  sendResetPasswordLinkEmail,
  sendVerificationEmail,
} from '../lib/resend';
import moment from 'moment';
import * as crypto from 'crypto';
import {
  createPasswordResetToken,
  getPasswordResetToken,
} from '../services/passwordResetToken.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiErrors';

// ==================================================================================
// Controllers
// ==================================================================================

/**
 * Authenticates user credentials and issues JWT cookies.
 * Checks verification status before allowing full session access.
 */
export const LoginUser = async (req: Request, res: Response) => {
  const parsedBody = LoginUserSchema.parse(req.body);

  const { email, password } = parsedBody;

  // Check credientials
  const user = await findUserByEmail(email);

  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const isValidPassword = await comparePassoword(
    password,
    user.hashed_password,
  );
  if (!isValidPassword) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  if (!user.is_verified) {
    // Delete the previous verfication codes of the user
    await deleteUserVerificationsCode(user.id);
    // Send and create verification code
    await sendVerificationCode(user.id);

    throw new ApiError(403, 'Please verify the user to get started');
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

  res.status(200).json(new ApiResponse(200, 'Logged in'));
};

/**
 * Creates new user credentials and initiates the email verification process.
 * * If the user exists but is unverified, it updates their profile (password/username)
 * and re-issues a verification code instead of creating a duplicate record.
 */
export const SignUpUser = async (req: Request, res: Response) => {
  // Validate incoming body
  const parsedBody = SignUpUserSchema.parse(req.body);
  const { username, password, email } = parsedBody;

  // Check duplicate user
  const userWithUsernameExist = await findUserByUsername(username);
  const userWithEmailExist = await findUserByEmail(email);

  if (userWithEmailExist && !userWithEmailExist.is_verified) {
    const hashedPassword = await hashPassword(password);

    // Update user with new password and username
    await updateUser(userWithEmailExist.id, {
      email,
      username,
      hashed_password: hashedPassword,
    });

    // Delete the previous verfication codes of the user
    await deleteUserVerificationsCode(userWithEmailExist.id);
    // Send and create verification code
    await sendVerificationCode(userWithEmailExist.id);

    return res
      .status(201)
      .json(new ApiResponse(201, 'Verify your email to get started'));
  }

  if (userWithUsernameExist) {
    throw new ApiError(409, 'Username already taken');
  }

  if (userWithEmailExist) {
    throw new ApiError(409, 'Email already registered');
  }

  const hashedPassword = await hashPassword(password);
  const createdUser = await createUser(username, email, hashedPassword);

  // Send and create verification code
  await sendVerificationCode(createdUser.id);

  res
    .status(201)
    .json(new ApiResponse(201, 'Verify your email to get started'));
};

/**
 * Issues a new access token using a valid refresh token.
 * Implements "Refresh Token Rotation" by invalidating the old token.
 * generating a new one, and persisting it to the database.
 * Updates the response cookies with the new token pair.
 */
export const RefreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, env.REFRESH_SECRET) as JwtPayloadUser;
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await findUserByEmail(decoded.email);

  if (!user || user.refresh_token !== refreshToken) {
    throw ApiError.unauthorized('Invalid or expired token');
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

  res.status(200).json(new ApiResponse(200, 'Token refreshed'));
};

/**
 * Verifies the user's email by using a 6-digit code.
 * * Validates the code againsts the database, checks for the expiration,
 * and marks the user account as verified.
 */
export const VerifyEmail = async (req: Request, res: Response) => {
  const parsedBody = VerifyEmailSchema.parse(req.body);
  const { email, code } = parsedBody;

  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(403, 'Invalid or expired verification code');
  }

  const verificationCode = await getVerification(code, user.id);

  if (!verificationCode || verificationCode.code !== code) {
    throw new ApiError(403, 'Invalid code');
  }

  // Check for expiry
  if (verificationCode.expires_at < Date.now()) {
    throw new ApiError(
      403,
      'Verification code has been expired, request another',
    );
  }

  // Mark user as verified
  await updateUser(user.id, {
    is_verified: true,
  });

  // TODO: invalidate the verify tokens

  res.status(200).json(new ApiResponse(200, 'Email verified'));
};

/**
 * Regenerates and sends a new 6-digit verification code.
 * Invalidate all existing codes for the user to prevent multi-code
 */
export const ResendCode = async (req: Request, res: Response) => {
  const parsedBody = ResendCodeSchema.parse(req.body);
  const { email } = parsedBody;

  const user = await findUserByEmail(email);

  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          'If an account exists, a verification code has been sent.',
        ),
      );
  }

  // Delete the previous verfication codes of the user
  await deleteUserVerificationsCode(user.id);

  // Send and create verification code
  await sendVerificationCode(user.id);

  // TODO: add rate limiting
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        'If an account exists, a verification code has been sent.',
      ),
    );
};

/**
 * Initiates the password recovery process.
 * Generates a secure random token, persists its SHA-256 hash to prevent database
 * sends a reset link to the user's email.
 */
export const ForgotPassword = async (req: Request, res: Response) => {
  const parsedBody = ForgotPasswordPayloadSchema.parse(req.body);

  const { email } = parsedBody;

  const user = await findUserByEmail(email);

  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          'If an account exists, a reset password link has been sent.',
        ),
      );
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = moment().add(15, 'm').toDate();

  await createPasswordResetToken(user.id, tokenHash, expiresAt);

  await sendResetPasswordLinkEmail(
    `http://localhost:3000/reset-password/${rawToken}`,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        'If an account exists, a reset password link has been sent.',
      ),
    );
};

/**
 * Finalizes the password reset using a raw recovery token.
 * Validates the token's hash against the database, checks for expiration,
 * and updates the user's credentials with the new hashed password.
 */
export const ResetPassword = async (req: Request, res: Response) => {
  const parsedBody = ResetPasswordPayloadSchema.parse(req.body);
  const { token, newPassword } = parsedBody;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const passwordResetToken = await getPasswordResetToken(tokenHash);

  if (!passwordResetToken) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  if (passwordResetToken.expires_at < Date.now()) {
    throw ApiError.unauthorized('Verification token has been expired');
  }

  const hashedPassword = await hashPassword(newPassword);

  const updatedUser = await updateUser(passwordResetToken.user_id, {
    hashed_password: hashedPassword,
  });

  if (updatedUser && updatedUser < 1) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  // TODO: invalidate the reset tokens

  res.status(200).json(new ApiResponse(200, 'Password reseted succesfully'));
};

// ==================================================================================
// Helpers
// ==================================================================================

/**
 * Generates a signed JWT for authorization.
 *
 * @param id - Internal User UUID
 * @param email - User email
 * @returns A HS256 signed JWT signed valid for 10 minutes
 */
function generateAccessToken(id: string, email: string) {
  const accessToken = jwt.sign({ id, email }, env.JWT_SECRET, {
    expiresIn: '600000ms', // 10 minutes
  });

  return accessToken;
}

/**
 * Generates and persists a long-lived JWT for session refreshing.
 *
 * @param id - Internal User ID
 * @param email - User email
 * @returns A HS256 signed JWT signed valid for 7 days
 */
async function generateRefreshToken(id: string, email: string) {
  const refreshToken = jwt.sign({ id: id, email: email }, env.REFRESH_SECRET, {
    expiresIn: '7d',
  });

  // Save refresh token in DB
  await saveRefreshToken(email, refreshToken);

  return refreshToken;
}

/**
 * Generates a 6-digit code
 *
 * @returns  Generated code
 */
function generateCode() {
  let numbers = [];

  for (let i = 0; i < 6; i++) {
    const code = Math.floor(Math.random() * 9);
    numbers.push(code);
  }

  return numbers.join('');
}

/**
 * Orchestrates the generation, persistence, and delivery of a verification code.
 * * 1. Generates a random 6-digit code.
 * 2. Persists the code with a 10-minute expiration.
 * 3. Dispatches the code to the user's email via Resend.
 *
 * @param userIb - Interal user UUID
 * @returns Promise<Void>
 */
async function sendVerificationCode(userId: string) {
  const verificationCode = generateCode();

  const expiryDate = moment().add(10, 'm').toDate();

  await createVerification(verificationCode, userId, expiryDate);
  await sendVerificationEmail(verificationCode);
}
