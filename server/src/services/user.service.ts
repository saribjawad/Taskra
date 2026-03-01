import { dbPool } from '../db';

/**
 * Find user with email
 *
 * @param email - User email
 * @returns The user row if found, otherwise undefined
 */
const findUserByEmail = async (email: string) => {
  const result = await dbPool.query(
    'SELECT email FROM users WHERE email = $1',
    [email],
  );

  return result.rows[0];
};

/**
 * Find user with username
 *
 * @param username - User username
 * @returns The user row if found, otherwise undefined
 */
const findUserByUsername = async (username: string) => {
  const result = await dbPool.query(
    'SELECT username FROM users WHERE username = $1',
    [username],
  );

  return result.rows[0];
};

export { findUserByEmail, findUserByUsername };
