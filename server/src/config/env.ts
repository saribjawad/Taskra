import dotenv from 'dotenv';
import z from 'zod';

dotenv.config({ path: './.env' });

const envSchema = z.object({
  PORT: z.string(),
  PGHOST: z.string(),
  PGUSER: z.string(),
  PGPASSWORD: z.string(),
  PGDATABASE: z.string(),
  PGPORT: z.string(),
  JWT_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);
