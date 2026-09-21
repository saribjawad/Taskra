import z from 'zod';

export const Priority = z.enum(
  ['urgent', 'high', 'medium', 'low', 'no_priority'],
  'Invalid priority',
);
