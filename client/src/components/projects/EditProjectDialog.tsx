import { useMemo, type Dispatch, type SetStateAction } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import z from 'zod'
import { useUpdateProject } from '#/hooks/project.hooks'
import type { ProjectDetail } from '#/type/project'
import TaskDescriptionEditor from '#/components/tasks/TaskDescriptionEditor'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Spinner } from '#/components/ui/spinner'
import type { UpdateProjectPayload } from '#/service/project.service'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a project title')
    .max(80, 'Use 80 characters or fewer'),
  shortSummary: z.string().trim().max(255, 'Use 255 characters or fewer'),
  description: z.string(),
})

type FormValues = z.infer<typeof schema>

export default function EditProjectDialog({
  project,
  workspaceId,
  open,
  onOpenChange,
}: {
  project: ProjectDetail
  workspaceId: string
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
}) {
  const initialValues = useMemo<FormValues>(
    () => ({
      name: project.name,
      shortSummary: project.short_summary ?? '',
      description: project.description ?? '',
    }),
    [project.description, project.name, project.short_summary],
  )
  const { mutateAsync, isPending } = useUpdateProject(workspaceId, project.id)
  const {
    control,
    handleSubmit,
    reset,
    formState: { dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: initialValues,
  })

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset(initialValues)
    onOpenChange(nextOpen)
  }

  async function submit(values: FormValues) {
    const payload: UpdateProjectPayload = {}
    if (dirtyFields.name) payload.name = values.name
    if (dirtyFields.shortSummary) payload.shortSummary = values.shortSummary
    if (dirtyFields.description) payload.description = values.description
    if (!Object.keys(payload).length || isPending) return

    try {
      await mutateAsync(payload)
      toast.success('Project updated')
      reset(values)
      onOpenChange(false)
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined
      toast.error(
        typeof message === 'string'
          ? message
          : 'Unable to update the project. Please try again.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-5 py-4 sm:px-6">
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>
            Update the project title, summary, or description.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(submit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <FieldGroup className="min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5 sm:px-6">
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-project-name">Title</FieldLabel>
                  <Input
                    {...field}
                    id="edit-project-name"
                    placeholder="Project title"
                    maxLength={80}
                    disabled={isPending}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="shortSummary"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-project-summary">
                    Summary{' '}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-project-summary"
                    placeholder="A short summary of this project"
                    maxLength={255}
                    disabled={isPending}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Description</FieldLabel>
                  <TaskDescriptionEditor
                    disabled={isPending}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
