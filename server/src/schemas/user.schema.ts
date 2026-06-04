import z from 'zod';

export const UpdateUserSchema = z.object({
  username: z
    .string('Username is required')
    .max(50, 'Username can not be more then 50 characters'),
});
