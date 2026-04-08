import { dbPool } from '../db';

/**
 * Create Password reset token in database
 *
 * @param userId - Internal User UUID
 * @param tokenHashed - Hashed token using SHA-256
 * @param expiresAt - Expiry time for token
 * @returns The password reset token created
 */
const createPasswordResetToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) => {
  const savedToken = await dbPool.query(
    `
      INSERT INTO password_reset_tokens(user_id, hash_key, expires_at)
      VALUES($1, $2, $3)
      RETURNING *`,
    [userId, tokenHash, expiresAt],
  );

  return savedToken.rows[0];
};

/**
 * Get Password reset token from database
 *
 * @param tokenHash - Hashed token for lookup
 * @returns The password reset token
 */
const getPasswordResetToken = async (tokenHash: string) => {
  const passwordResetToken = await dbPool.query(
    `
    SELECT * FROM password_reset_tokens WHERE hash_key = $1`,
    [tokenHash],
  );

  return passwordResetToken.rows[0];
};

export { createPasswordResetToken, getPasswordResetToken };
