import pg from 'pg';

const { Pool } = pg;

// Init DB pool
export const dbPool = new Pool();
