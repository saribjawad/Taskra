import { dbPool } from '../db';

/**
 * Find user with email
 *
 * @param email - User email
 * @returns The user row if found, otherwise undefined
 */
const findUserByEmail = async (email: string) => {
  const result = await dbPool.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);

  return result.rows[0];
};

/** Find user with username
 *
 * @param username - User username
 * @returns The user row if found, otherwise undefined
 */
const findUserByUsername = async (username: string) => {
  const result = await dbPool.query('SELECT * FROM users WHERE username = $1', [
    username,
  ]);

  return result.rows[0];
};

/**
 * Create user in database
 *
 * @param username - User username
 * @param email - User email
 * @param hashedPassword - User hashedpassword
 * @returns The user row if found, otherwise undefined
 */
const createUser = async (
  username: string,
  email: string,
  hashedPassword: string,
) => {
  const result = await dbPool.query(
    `
    INSERT INTO users(username, email, hashed_password)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [username, email, hashedPassword],
  );

  return result.rows[0];
};

/**
 * Save refresh token in database
 *
 * @param email - User email
 * @param refreshToken - User's refresh token
 * @returns The updated row count
 */
const saveRefreshToken = async (email: string, refreshToken: string) => {
  const result = await dbPool.query(
    `
    UPDATE users
    SET refresh_token = ($1)
    WHERE email = ($2)`,
    [refreshToken, email],
  );

  return result.rowCount;
};

/**
 * Update the user in database
 *
 * @param id - User ID
 * @param data - Object containing the fields to update
 * @param data.email - The user's email address (optional)
 * @param data.username - The user's unique username (optional)
 * @param data.is_verified - The user's verification status (optional)
 * @param data.hashed_password - The user's hash password (optional)
 * @returns The updated row count
 */
const updateUser = async (
  id: string,
  data: {
    email?: string;
    username?: string;
    is_verified?: boolean;
    hashed_password?: string;
  },
) => {
  const keys = Object.keys(data);
  const values = Object.values(data);

  const result = await dbPool.query(
    `
    UPDATE users
    SET ${keys
      .map((k, i) => `${k} = $${i + 1}${i + 1 < keys.length ? ',' : ''}`)
      .join(' ')}
    WHERE id = $${keys.length + 1}`,
    [...values, id],
  );

  return result.rowCount;
};

export {
  findUserByEmail,
  findUserByUsername,
  createUser,
  saveRefreshToken,
  updateUser,
};
