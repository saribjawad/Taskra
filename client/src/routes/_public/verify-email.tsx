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
import { createFileRoute } from '@tanstack/react-router'
import { Input } from '#/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { Button } from '#/components/ui/button'
import { useResendCode, useVerifyEmail } from '#/hooks/auth.hooks'
import { Spinner } from '#/components/ui/spinner'

export const VerifyEmailSchema = z.object({
  email: z.string('Email is required').min(1, 'Email is required'),
  code: z
    .string()
    .min(1, 'Code is required')
    .refine((val) => val.length === 6, {
      error: 'Invalid code',
    }),
})

export type VerifyEmailFormPayload = z.infer<typeof VerifyEmailSchema>

const verifyEmailSearchSchema = z.object({
  email: z.email(),
})

export const Route = createFileRoute('/_public/verify-email')({
  validateSearch: verifyEmailSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const search = Route.useSearch() as { email?: string }
  const { mutate: verifyEmailMutation, isPending } = useVerifyEmail()
  const { mutate: resendCode, isPending: isResendingCode } = useResendCode()

  const form = useForm({
    resolver: zodResolver(VerifyEmailSchema),
    defaultValues: {
      email: search?.email ?? '',
      code: '',
    },
  })

  function onSubmit(data: VerifyEmailFormPayload) {
    verifyEmailMutation(data)
  }

  function onResend() {
    resendCode(search.email!!)
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex min-w-full flex-col gap-8 p-6 md:min-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Verify Email</CardTitle>
            <CardDescription>
              Enter the 6-digit code we sent to your email to verify your
              account.
            </CardDescription>
            <CardAction>Logo</CardAction>
          </CardHeader>

          <CardContent>
            <form id="verify-email-form" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="verify-email-email">
                        Email
                      </FieldLabel>
                      <Input
                        disabled={true}
                        {...field}
                        id="verify-email-email"
                        placeholder="sarib@gmail.com"
                        autoComplete="email"
                        aria-invalid={fieldState.invalid}
                        readOnly={!!search?.email}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="code"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="verify-email-code">
                        Verification Code
                      </FieldLabel>
                      <Input
                        {...field}
                        disabled={isPending || isResendingCode}
                        id="verify-email-code"
                        placeholder="123456"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
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
                disabled={isPending || isResendingCode}
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>

              <Button
                disabled={isPending || isResendingCode}
                type="submit"
                form="verify-email-form"
              >
                {isPending && <Spinner />}
                Verify Email
              </Button>
            </Field>
          </CardFooter>
        </Card>

        <div className="flex justify-center  text-sm">
          <p>Didn&apos;t receive a code?</p>

          <Button
            disabled={isPending || isResendingCode}
            size="xs"
            variant="link"
            onClick={() => onResend()}
            className="cursor-pointer"
          >
            <strong>Resend</strong>
          </Button>
        </div>
      </div>
    </main>
  )
}
