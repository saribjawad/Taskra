import z from 'zod';

const envSchema = z.object({
  PORT: z.string(),
  PGHOST: z.string(),
  PGUSER: z.string(),
  PGPASSWORD: z.string(),
  PGDATABASE: z.string(),
  PGPORT: z.string(),
});

export const env = envSchema.parse(process.env);
