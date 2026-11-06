import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import AuthLogo from '#/components/auth/AuthLogo'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Controller, useForm } from 'react-hook-form'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Input } from '#/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { Button } from '#/components/ui/button'
import { useResetPassword } from '#/hooks/auth.hooks'
import { Spinner } from '#/components/ui/spinner'

const resetPasswordSearchSchema = z.object({
  token: z.string().min(1),
})

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormPayload = z.infer<typeof ResetPasswordSchema>

export const Route = createFileRoute('/_public/reset-password')({
  validateSearch: resetPasswordSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const { token } = Route.useSearch()
  const { mutate: resetPasswordMutation, isPending } = useResetPassword()

  const form = useForm({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: '',
    },
  })

  function onSubmit(data: ResetPasswordFormPayload) {
    resetPasswordMutation(data)
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex min-w-full flex-col gap-8 p-6 md:min-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Choose a new password for your account.
            </CardDescription>
            <CardAction>
              <AuthLogo />
            </CardAction>
          </CardHeader>

          <CardContent>
            <form
              id="reset-password-form"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FieldGroup>
                <Controller
                  name="token"
                  control={form.control}
                  render={({ field }) => <input {...field} type="hidden" />}
                />

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="reset-password-password">
                        New Password
                      </FieldLabel>
                      <Input
                        disabled={isPending}
                        {...field}
                        id="reset-password-password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="reset-password-confirm-password">
                        Confirm New Password
                      </FieldLabel>
                      <Input
                        disabled={isPending}
                        {...field}
                        id="reset-password-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <Field orientation="vertical" className="justify-end">
              <Button
                disabled={isPending}
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>

              <Button
                disabled={isPending}
                type="submit"
                form="reset-password-form"
              >
                {isPending && <Spinner />}
                Reset Password
              </Button>
            </Field>
          </CardFooter>
        </Card>

        <div className="flex justify-center gap-1 text-sm">
          <p>Remembered your password?</p>
          <Link disabled={isPending} to="/sign-in">
            <strong>Sign in</strong>
          </Link>
        </div>
      </div>
    </main>
  )
}
