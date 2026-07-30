import { Button } from '#/components/ui/button'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Spinner } from '#/components/ui/spinner'
import { useCreateWorkspace } from '#/hooks/workspace.hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'

export const Route = createFileRoute('/_authenticated/create-workspace')({
  component: RouteComponent,
})

const CreateWorkspaceFormSchema = z.object({
  name: z
    .string('Invalid name')
    .min(1, 'Name is required')
    .max(250, 'Maximum 250 characters'),
})

export type CreateWorkspaceFormPayload = z.infer<
  typeof CreateWorkspaceFormSchema
>

function RouteComponent() {
  const { mutate: createWorkspaceMutate, isPending } = useCreateWorkspace()

  const form = useForm({
    resolver: zodResolver(CreateWorkspaceFormSchema),
    defaultValues: {
      name: '',
    },
  })

  function onSubmit(data: z.infer<typeof CreateWorkspaceFormSchema>) {
    createWorkspaceMutate(data)
  }

  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center gap-10">
      {/* Header */}
      <div className="flex flex-col items-center gap-1">
        {/* TODO: add proper consitentcy in colors */}
        <h2 className="text-xl font-bold">Create Workspace</h2>
        <p className="text-sm text-zinc-500">
          Move workforward across teams and agents
        </p>
      </div>

      <form
        id="create-workspace-form"
        className="flex flex-col gap-10"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-workspace-name">Name</FieldLabel>
              <Input
                disabled={isPending}
                {...field}
                id="create-workspace-name"
                aria-invalid={fieldState.invalid}
                placeholder="Acme Inc."
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button disabled={isPending} type="submit" form="create-workspace-form">
          {isPending && <Spinner />}
          Create Workspace
        </Button>
      </form>
    </main>
  )
}
