import type { Dispatch, ReactElement, SetStateAction } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Maximize2, X } from 'lucide-react'
import z from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field'
import { Input } from '../ui/input'
import { useUpdateTask } from '#/hooks/task.hook'
import { Spinner } from '../ui/spinner'
import TaskDescriptionEditor from './TaskDescriptionEditor'
import AttachmentField, {
  ACCEPTED_DOCUMENT_TYPES,
  ACCEPTED_IMAGE_TYPES,
} from '../fields/AttachmentField'
import type { ExistingAttachment } from '../fields/AttachmentField'
import { createAttachmentsSchema } from '#/schema/attachment.schema'
import { useMemo } from 'react'
import type { UpdateTaskPayload } from '#/service/task.service'

interface EditTaskDialogProps {
  trigger: ReactElement
  task: {
    id: string
    title: string
    description: string
    attachments?: ExistingAttachment[]
  }
  isDialogOpen: boolean
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>
}

function EditTaskDialog({
  trigger: dialogTrigger,
  task,
  isDialogOpen,
  setIsDialogOpen,
}: EditTaskDialogProps) {
  const existingAttachments = task.attachments ?? []
  const existingCounts = useMemo(
    () => ({
      images: existingAttachments.filter((a) =>
        ACCEPTED_IMAGE_TYPES.includes(a.mime_type),
      ).length,
      documents: existingAttachments.filter((a) =>
        ACCEPTED_DOCUMENT_TYPES.includes(a.mime_type),
      ).length,
    }),
    [existingAttachments],
  )

  const { mutateAsync: updateTask, isPending } = useUpdateTask()
  const initialValues = {
    title: task.title,
    description: task.description,
    attachments: [] as File[],
    removedAttachmentIds: [] as string[],
  }
  const EditTaskFormSchema = useMemo(
    () =>
      z.object({
        title: z
          .string('Invalid title')
          .min(1, 'Title is required')
          .max(250, 'Title cannot be more than 250 words'),
        description: z.string().min(1, 'Description is required'),
        attachments: createAttachmentsSchema(existingCounts),
        removedAttachmentIds: z.array(z.string()).optional().default([]),
      }),
    [existingCounts],
  )

  const {
    handleSubmit,
    control,
    reset,
    trigger,
    formState: { isDirty, dirtyFields },
  } = useForm({
    resolver: zodResolver(EditTaskFormSchema),
    values: initialValues,
  })

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      reset(initialValues)
      existingCounts.images = existingAttachments.filter((attachment) =>
        ACCEPTED_IMAGE_TYPES.includes(attachment.mime_type),
      ).length
      existingCounts.documents = existingAttachments.filter((attachment) =>
        ACCEPTED_DOCUMENT_TYPES.includes(attachment.mime_type),
      ).length
    }
    setIsDialogOpen(open)
  }

  async function onSubmit(data: z.infer<typeof EditTaskFormSchema>) {
    if (!isDirty || isPending) return

    const payload: UpdateTaskPayload = {}

    for (const field of ['title', 'description'] as const) {
      if (dirtyFields[field]) Object.assign(payload, { [field]: data[field] })
    }

    if (data.attachments?.length) payload.attachments = data.attachments
    if (data.removedAttachmentIds.length) {
      payload.removedAttachmentIds = data.removedAttachmentIds
    }

    if (!Object.keys(payload).length) return

    await updateTask({
      taskId: task.id,
      payload,
    })
    // Manually close the dialog and reset the form
    reset({ ...data, attachments: [], removedAttachmentIds: [] })
    setIsDialogOpen(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className=" min-w-[70vw] lg:min-w-[50vw] max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <DialogHeader>
          <div className="w-full  flex items-center justify-between">
            {/* Title */}
            <DialogTitle>Edit task</DialogTitle>

            {/* Button */}
            <div>
              <Button
                disabled={isPending}
                variant="ghost"
                type="button"
                size="icon-sm"
              >
                <Maximize2 />
              </Button>
              <DialogClose asChild>
                <Button
                  disabled={isPending}
                  variant="ghost"
                  type="button"
                  size="icon-sm"
                >
                  <X />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <FieldGroup className="overflow-y-auto">
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                  <Input
                    disabled={isPending}
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="What needs to be done?"
                    autoComplete="off"
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
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
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

            <Controller
              name="removedAttachmentIds"
              control={control}
              render={({ field: removedField }) => (
                <Controller
                  name="attachments"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Attachments</FieldLabel>
                      <AttachmentField
                        disabled={isPending}
                        value={field.value ?? []}
                        onChange={(files) => {
                          field.onChange(files)
                          trigger('attachments')
                        }}
                        error={fieldState.error?.message}
                        existingAttachments={existingAttachments.filter(
                          (a) => !(removedField.value ?? []).includes(a.id),
                        )}
                        onRemoveExisting={(id: string, mimeType: string) => {
                          if (ACCEPTED_IMAGE_TYPES.includes(mimeType)) {
                            existingCounts.images -= 1
                          }
                          if (ACCEPTED_DOCUMENT_TYPES.includes(mimeType)) {
                            existingCounts.documents -= 1
                          }

                          removedField.onChange([
                            ...(removedField.value ?? []),
                            id,
                          ])
                          trigger('attachments')
                        }}
                      />
                    </Field>
                  )}
                />
              )}
            />
          </FieldGroup>
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button disabled={isPending} type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>

            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending && <Spinner />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditTaskDialog
