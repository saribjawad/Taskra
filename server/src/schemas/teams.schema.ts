import z from 'zod';

export const CreateTeamBodySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(24, 'Name cannot be more then 24 characters'),
  identifier: z
    .string()
    .min(3, 'Should be of minimum 3 characters')
    .max(6, 'Cannot be more than 6 characters')
    .transform((val) => val.toUpperCase()),
  description: z.string().optional(),
});
