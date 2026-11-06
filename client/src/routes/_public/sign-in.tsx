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
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Input } from '#/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { Button } from '#/components/ui/button'
import { useSignIn } from '#/hooks/auth.hooks'
import { Spinner } from '#/components/ui/spinner'

const SignInFormSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string('Invalid password'),
})

export type SignInFormPayload = z.infer<typeof SignInFormSchema>

export const Route = createFileRoute('/_public/sign-in')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { mutate: signInMutate, isPending } = useSignIn()

  const form = useForm({
    resolver: zodResolver(SignInFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function onSubmit(data: z.infer<typeof SignInFormSchema>) {
    signInMutate(data)
  }

  return (
    <main className="h-screen w-screen bg-background flex items-center justify-center">
      <div className="min-w-full md:min-w-lg p-6 flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Sign in to get started.</CardDescription>
            <CardAction>
              <AuthLogo />
            </CardAction>
          </CardHeader>
          <CardContent>
            <form
              id="sign-in-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-1"
            >
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
                      <Input
                        disabled={isPending}
                        {...field}
                        id="sign-in-email"
                        aria-invalid={fieldState.invalid}
                        placeholder="jhondoe@abc.com"
                        autoComplete="off"
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
                      <FieldLabel htmlFor="sign-in-password">
                        Password
                      </FieldLabel>
                      <Input
                        {...field}
                        disabled={isPending}
                        id="sign-in-password"
                        type="password"
                        aria-invalid={fieldState.invalid}
                        placeholder="••••••••"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
              <Button
                disabled={isPending}
                className="self-end"
                type="button"
                variant="link"
                size="xs"
                onClick={() => {
                  navigate({
                    to: '/forgot-password',
                  })
                }}
              >
                Forgot password?
              </Button>
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
              <Button disabled={isPending} type="submit" form="sign-in-form">
                {isPending && <Spinner />}
                Sign in
              </Button>
            </Field>
          </CardFooter>
        </Card>
        <div className="flex text-sm justify-center gap-1">
          <p>Don't have an account?</p>
          <Link disabled={isPending} to="/sign-up">
            <strong>Sign up now</strong>
          </Link>
        </div>
      </div>
    </main>
  )
}
