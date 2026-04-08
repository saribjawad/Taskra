import { dbPool } from '../db';

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

const getPasswordResetToken = async (tokenHash: string) => {
  const passwordResetToken = await dbPool.query(
    `
    SELECT * FROM password_reset_tokens WHERE hash_key = $1`,
    [tokenHash],
  );

  return passwordResetToken.rows[0];
};

export { createPasswordResetToken, getPasswordResetToken };
