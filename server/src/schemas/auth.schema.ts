import z from 'zod';

// Login user payload schema
export const LoginUserSchema = z.object({
  email: z.email('Invalid email'),
  password: z
    .string('Password is required')
    .min(8, 'Password should be minimum of 8 characters'),
});

// Signup user payload schema
export const SignUpUserSchema = z
  .object({
    username: z
      .string('Username is required')
      .max(50, 'Username can not be more then 50 characters'),
    email: z.email('Invalid email'),
    password: z
      .string('Password is required')
      .min(8, 'Password should be minimum of 8 characters'),
    confirmPassword: z.string('Confirm passowrd is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Verify email payload schema
export const VerifyEmailSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .refine((val) => val.length === 6, {
      error: 'Invalid code',
    }),
});
