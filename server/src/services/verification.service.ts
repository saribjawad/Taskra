import { dbPool } from '../db';

/**
 * Get verification
 *
 * @param code - Verification code
 * @param userId - User ID of the user
 * @returns The verification created
 */
const getVerification = async (code: string, userId: string) => {
  const result = await dbPool.query(
    `
    SELECT * FROM verifications
    WHERE code = $1 AND user_id = $2;`,
    [code, userId],
  );

  return result.rows[0];
};

/**
 * Create verification in database
 *
 * @param code - Verification code
 * @param userId - User id to which verification code belongs to
 * @param expiresAt - Expiry time for code
 * @returns The verification created
 */
const createVerification = async (
  code: string,
  userId: string,
  expiresAt: Date,
) => {
  const result = await dbPool.query(
    `
    INSERT INTO verifications(code, user_id, expires_at)
    VALUES($1, $2, $3)
    RETURNING *`,
    [code, userId, expiresAt],
  );

  return result.rows[0];
};

/**
 * Delete user's verification in database
 *
 * @param userId - User id to which verification code belongs to
 * @returns The number of rows deleted
 */
const deleteUserVerificationsCode = async (userId: string) => {
  const result = await dbPool.query(
    `
    DELETE FROM verifications WHERE user_id = $1`,
    [userId],
  );

  return result.rowCount;
};

export { getVerification, createVerification, deleteUserVerificationsCode };
