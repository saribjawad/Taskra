import pg from 'pg';

const { Pool } = pg;

// Temp init of pg pool (e.g migrate to drizzle or prisma)
export const dbPool = new Pool();
