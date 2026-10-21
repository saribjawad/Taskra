import { PoolClient } from 'pg';
import { dbPool } from '../db';
import { User } from '../models/user.model';

/**
 * Find user with id
 *
 * @param id - User ID
 * @returns The user row if found, otherwise undefined
 */
const findUserById = async (id: string): Promise<User> => {
  const result = await dbPool.query('SELECT * FROM users WHERE id = $1', [id]);

  return result.rows[0];
};

/**
 * Find user with email
 *
 * @param email - User email
 * @returns The user row if found, otherwise undefined
 */
const findUserByEmail = async (email: string): Promise<User> => {
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
  fullName: string,
  username: string,
  email: string,
  hashedPassword: string,
) => {
  const result = await dbPool.query(
    `
    INSERT INTO users(full_name, username, email, hashed_password)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [fullName, username, email, hashedPassword],
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
 * Remove refresh token from database
 *
 * @param email - User email
 * @returns The updated row count
 */
const removeRefreshToken = async (email: string) => {
  const result = await dbPool.query(
    `
    UPDATE users
    SET refresh_token = null
    WHERE email = ($1)`,
    [email],
  );

  return result.rowCount;
};

/**
 * Update the user in database
 *
 * @param payload - User ID and fields to update
 * @returns The updated row count
 */
const updateUser = async (
  payload: {
    id: string;
    email?: string;
    username?: string;
    full_name?: string;
    is_verified?: boolean;
    hashed_password?: string;
    active_workspace?: string;
  },
  txClient?: PoolClient,
) => {
  const { id, ...data } = payload;
  const keys = Object.keys(data);
  const values = Object.values(data);

  const db = txClient || dbPool;
  const result = await db.query(
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
  findUserById,
  findUserByEmail,
  findUserByUsername,
  createUser,
  saveRefreshToken,
  removeRefreshToken,
  updateUser,
};
