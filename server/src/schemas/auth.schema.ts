import z from 'zod';

export const LoginUserSchema = z.object({
  email: z.email('Invalid email'),
  password: z
    .string('Password is required')
    .min(8, 'Password should be minimum of 8 characters'),
});

export const SignUpUserSchema = z
  .object({
    fullName: z
      .string('Full name is required')
      .trim()
      .min(1, 'Full name is required')
      .max(100, 'Full name can not be more than 100 characters'),
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

export const VerifyEmailSchema = z.object({
  email: z.string('Email is required'),
  code: z
    .string()
    .min(1, 'Code is required')
    .refine((val) => val.length === 6, {
      error: 'Invalid code',
    }),
});

export const ResendCodeSchema = z.object({
  email: z.string('Email is required'),
});

export const ForgotPasswordPayloadSchema = ResendCodeSchema;

export const ResetPasswordPayloadSchema = z.object({
  token: z
    .string()
    .length(64)
    .regex(/^[0-9a-fA-F]+$/, 'Must be a hexadecimal string'),
  newPassword: z
    .string('New password is required')
    .min(8, 'New password should be minimum of 8 characters'),
});
