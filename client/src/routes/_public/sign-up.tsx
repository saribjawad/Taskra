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
import { useSignUp } from '#/hooks/auth.hooks'
import { Spinner } from '#/components/ui/spinner'

const SignUpFormSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required').max(100),
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    email: z.email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignUpFormPayload = z.infer<typeof SignUpFormSchema>

export const Route = createFileRoute('/_public/sign-up')({
  component: RouteComponent,
})

function RouteComponent() {
  const { mutate: signUpMutation, isPending } = useSignUp()

  const form = useForm({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  function onSubmit(data: z.infer<typeof SignUpFormSchema>) {
    signUpMutation(data)
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex min-w-full flex-col gap-8 p-6 md:min-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create an account to get started.</CardDescription>
            <CardAction>Logo</CardAction>
          </CardHeader>

          <CardContent>
            <form id="sign-up-form" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="fullName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="sign-up-full-name">
                        Full name
                      </FieldLabel>
                      <Input
                        {...field}
                        disabled={isPending}
                        id="sign-up-full-name"
                        placeholder="Jhon Doe"
                        autoComplete="name"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="username"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="sign-up-username">
                        Username
                      </FieldLabel>
                      <Input
                        {...field}
                        disabled={isPending}
                        id="sign-up-username"
                        placeholder="jhonedoe"
                        autoComplete="username"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
                      <Input
                        {...field}
                        disabled={isPending}
                        id="sign-up-email"
                        placeholder="jhon@xyz.com"
                        autoComplete="email"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="sign-up-password">
                        Password
                      </FieldLabel>
                      <Input
                        {...field}
                        disabled={isPending}
                        id="sign-up-password"
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
                      <FieldLabel htmlFor="sign-up-confirm-password">
                        Confirm Password
                      </FieldLabel>
                      <Input
                        {...field}
                        disabled={isPending}
                        id="sign-up-confirm-password"
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
                type="button"
                disabled={isPending}
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>

              <Button disabled={isPending} type="submit" form="sign-up-form">
                {isPending && <Spinner />}
                Create Account
              </Button>
            </Field>
          </CardFooter>
        </Card>

        <div className="flex justify-center gap-1 text-sm">
          <p>Already have an account?</p>
          <Link disabled={isPending} to="/sign-in">
            <strong>Sign in</strong>
          </Link>
        </div>
      </div>
    </main>
  )
}
