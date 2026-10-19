import pg from 'pg';
import { env } from '../config/env';

const { Pool } = pg;

export const pool = new Pool();

// Temp init of pg pool (e.g migrate to drizzle or prisma)
export const dbPool = new Pool({
  host: env.PGHOST,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  database: env.PGDATABASE,
  port: Number(env.PGPORT),
});
