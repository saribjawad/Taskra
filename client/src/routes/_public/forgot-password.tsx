import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
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

    // TODO: add loading state
    console.log('is pending', isPending)
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
            <CardAction>Logo</CardAction>
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
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>

              <Button type="submit" form="forgot-password-form">
                Send Reset Link
              </Button>
            </Field>
          </CardFooter>
        </Card>

        <div className="flex justify-center gap-1 text-sm">
          <p>Remembered your password?</p>
          <Link to="/sign-in">
            <strong>Sign in</strong>
          </Link>
        </div>
      </div>
    </main>
  )
}
