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
import { useForgotPassword } from '#/hooks/auth.hooks'
import { Spinner } from '#/components/ui/spinner'

export const ForgotPasswordSchema = z.object({
  email: z.email('Invalid email'),
})

export type ForgotPasswordFormPayload = z.infer<typeof ForgotPasswordSchema>

export const Route = createFileRoute('/_public/forgot-password')({
  component: RouteComponent,
})

function RouteComponent() {
  const { mutate: forgotPasswordMutation, isPending } = useForgotPassword()

  const form = useForm({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  function onSubmit(data: ForgotPasswordFormPayload) {
    forgotPasswordMutation(data.email)
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex min-w-full flex-col gap-8 p-6 md:min-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </CardDescription>
            <CardAction>
              <AuthLogo />
            </CardAction>
          </CardHeader>

          <CardContent>
            <form
              id="forgot-password-form"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="forgot-password-email">
                        Email
                      </FieldLabel>
                      <Input
                        {...field}
                        disabled={isPending}
                        id="forgot-password-email"
                        placeholder="sarib@gmail.com"
                        autoComplete="email"
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
                form="forgot-password-form"
              >
                {isPending && <Spinner />}
                Send Reset Link
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
