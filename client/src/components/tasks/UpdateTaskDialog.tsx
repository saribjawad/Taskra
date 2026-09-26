import { type Dispatch, type ReactElement, type SetStateAction } from 'react'
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useUpdateTask } from '#/hooks/task.hook'
import { Spinner } from '../ui/spinner'
import TaskDescriptionEditor from './TaskDescriptionEditor'
import AttachmentField, {
  ACCEPTED_DOCUMENT_TYPES,
  ACCEPTED_IMAGE_TYPES,
  type ExistingAttachment,
} from '../fields/AttachmentField'
import { createAttachmentsSchema } from '#/schema/attachment.schema'
import { useMemo } from 'react'
import { useParams } from '@tanstack/react-router'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'
import DateField from '../fields/DateField'
import type { UpdateTaskPayload } from '#/service/task.service'

interface EditTaskDialogProps {
  trigger: ReactElement
  task: {
    id: string
    title: string
    description: string
    status: string
    priority: string
    label: string
    assignee?: { id: string; username: string; email: string }
    reporter?: { id: string; username: string; email: string }
    start_date: string
    due_date: string
    completed_date: string
    attachments?: ExistingAttachment[]
  }
  isDialogOpen: boolean
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>
}

const Status = z.enum(
  ['backlog', 'todo', 'in_progress', 'done', 'cancelled'],
  'Invalid status',
)
const Priority = z.enum(
  ['urgent', 'high', 'medium', 'low', 'no_priority'],
  'Invalid priority',
)
const Label = z.enum(['bug', 'feature', 'improvement'], 'Invalid label')

// TODO: temp move to a separate file
const statusItems = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'Todo', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
  { label: 'Cancelled', value: 'cancelled' },
]

const priorityItems = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
  { label: 'No priority', value: 'no_priority' },
]

const labelItems = [
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Improvement', value: 'improvement' },
]

function EditTaskDialog({
  trigger: dialogTrigger,
  task,
  isDialogOpen,
  setIsDialogOpen,
}: EditTaskDialogProps) {
  const params = useParams({ strict: false }) as { workspaceId: string }

  const { data: workspaceUsers } = useGetWorkspaceUsers(params.workspaceId)

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
  const EditTaskFormSchema = useMemo(
    () =>
      z
        .object({
          title: z
            .string('Invalid title')
            .min(1, 'Title is required')
            .max(250, 'Title cannot be more than 250 words'),
          description: z.string().min(1, 'Description is required'),
          status: Status,
          priority: Priority,
          label: Label,
          assignee: z.string('Invalid assignee').optional(),
          reporter: z.string('Invalid reporter').optional(),
          attachments: createAttachmentsSchema(existingCounts),
          startDate: z.date().optional(),
          dueDate: z.date().optional(),
          removedAttachmentIds: z.array(z.string()).optional().default([]),
        })
        .refine(
          (data) =>
            !data.startDate || !data.dueDate || data.dueDate >= data.startDate,
          {
            message: 'Due date cannot be before start date',
            path: ['dueDate'],
          },
        ),
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
    values: {
      title: task.title,
      description: task.description,
      assignee: task.assignee?.id ?? 'noassignee',
      label: task.label as z.infer<typeof Label>,
      reporter: task.reporter?.id ?? 'noreporter',
      priority: task.priority as z.infer<typeof Priority>,
      status: task.status as z.infer<typeof Status>,
      startDate: task.start_date ? new Date(task.start_date) : undefined,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      attachments: [],
      removedAttachmentIds: [],
    },
  })

  async function onSubmit(data: z.infer<typeof EditTaskFormSchema>) {
    if (!isDirty || isPending) return

    const payload: UpdateTaskPayload = {}
    const clearFields: ('assignee' | 'reporter')[] = []

    for (const field of [
      'title',
      'description',
      'status',
      'priority',
      'label',
    ] as const) {
      if (dirtyFields[field]) Object.assign(payload, { [field]: data[field] })
    }

    for (const field of ['assignee', 'reporter'] as const) {
      if (!dirtyFields[field]) continue
      if (data[field] === `no${field}`) {
        clearFields.push(field)
      } else if (data[field]) {
        payload[field] = data[field]
      }
    }

    if (clearFields.length) payload.clearFields = clearFields

    for (const field of ['startDate', 'dueDate'] as const) {
      if (dirtyFields[field] && data[field]) {
        payload[field] = data[field].toISOString()
      }
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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
          className="flex flex-col flex-1 "
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

            <div className="grid grid-cols-2 gap-2">
              <Controller
                name="startDate"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Start date</FieldLabel>
                    <DateField
                      id={field.name}
                      disabled={isPending}
                      aria-invalid={fieldState.invalid}
                      value={field.value}
                      onChange={(date) => {
                        field.onChange(date)
                        trigger('dueDate') // re-check the cross-field refine
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="dueDate"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Due date</FieldLabel>
                    <DateField
                      id={field.name}
                      disabled={isPending}
                      aria-invalid={fieldState.invalid}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Controller
                name="status"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Status</FieldLabel>

                    <Select
                      disabled={isPending}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          {statusItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="priority"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Priority</FieldLabel>

                    <Select
                      disabled={isPending}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Priority</SelectLabel>
                          {priorityItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="label"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Label</FieldLabel>

                    <Select
                      disabled={isPending}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Label</SelectLabel>
                          {labelItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="assignee"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Assignee</FieldLabel>

                    <Select
                      disabled={isPending}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Assignee</SelectLabel>
                          {workspaceUsers && (
                            <SelectItem value="noassignee">
                              No assignee
                            </SelectItem>
                          )}
                          {workspaceUsers ? (
                            workspaceUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.username}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-users" disabled>
                              No users in this workspace
                            </SelectItem>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="reporter"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Reporter</FieldLabel>

                    <Select
                      disabled={isPending}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select reporter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Reporter</SelectLabel>
                          {workspaceUsers && (
                            <SelectItem value="noreporter">
                              No reporter
                            </SelectItem>
                          )}
                          {workspaceUsers ? (
                            workspaceUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.username}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-users" disabled>
                              No users in this workspace
                            </SelectItem>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
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
