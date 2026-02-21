import z from 'zod';

export const LoginUserSchema = z.object({
  username: z
    .string('Username is required')
    .max(50, 'Username can not be more then 50 characters'),
  email: z.email('Invalid email'),
  password: z
    .string('Password is required')
    .min(8, 'Password should be minimum of 8 characters'),
});
