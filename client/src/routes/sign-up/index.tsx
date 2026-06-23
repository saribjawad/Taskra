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

const SignUpFormSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    email: z.email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const Route = createFileRoute('/sign-up/')({
  component: RouteComponent,
})

function RouteComponent() {
  const form = useForm({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  function onSubmit(data: z.infer<typeof SignUpFormSchema>) {
    console.log(data)
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
                  name="username"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="sign-up-username">
                        Username
                      </FieldLabel>
                      <Input
                        {...field}
                        id="sign-up-username"
                        placeholder="sarib"
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
                        id="sign-up-email"
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
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>

              <Button type="submit" form="sign-up-form">
                Create Account
              </Button>
            </Field>
          </CardFooter>
        </Card>

        <div className="flex justify-center gap-1 text-sm">
          <p>Already have an account?</p>
          <Link to="/sign-in">
            <strong>Sign in</strong>
          </Link>
        </div>
      </div>
    </main>
  )
}
