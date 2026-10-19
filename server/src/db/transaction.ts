import { PoolClient } from 'pg';
import { pool } from '.';
import { ApiError } from '../utils/ApiErrors';

/**
 * Executes a set of database operations within a single SQL transaction.
 *
 * Automatically handles `BEGIN`, `COMMIT`, `ROLLBACK`, and releases
 * the client back to the pool regardless of success or failure.
 *
 * @param callback Async function executing queries using the provided transactional `PoolClient`.
 * @returns The result returned by the callback.
 * @throws Re-throws any error caught during execution after performing a ROLLBACK
 */
export async function executeTranscation<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
