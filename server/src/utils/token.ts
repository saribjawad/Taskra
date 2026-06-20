import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { saveRefreshToken } from '../services/user.service';

/**
 * Generates a signed JWT for authorization.
 *
 * @param id - Internal User UUID
 * @param email - User email
 * @param activeWorkspace - User's active workspace
 * @returns A HS256 signed JWT signed valid for 10 minutes
 */
export function generateAccessToken(
  id: string,
  email: string,
  activeWorkspace: string | null,
) {
  const accessToken = jwt.sign({ id, email, activeWorkspace }, env.JWT_SECRET, {
    expiresIn: '600000ms', // 10 minutes
  });

  return accessToken;
}

/**
 * Generates and persists a long-lived JWT for session refreshing.
 *
 * @param id - Internal User ID
 * @param email - User email
 * @param activeWorkspace - User's active workspace
 * @returns A HS256 signed JWT signed valid for 7 days
 */
export async function generateRefreshToken(
  id: string,
  email: string,
  activeWorkspace: string | null,
) {
  const refreshToken = jwt.sign(
    { id, email, activeWorkspace },
    env.REFRESH_SECRET,
    {
      expiresIn: '7d',
    },
  );

  // Save refresh token in DB
  await saveRefreshToken(email, refreshToken);

  return refreshToken;
}
