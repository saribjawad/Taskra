import { type ReactElement, type SetStateAction } from 'react'
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
import { useCreateTask } from '#/hooks/task.hook'
import { Spinner } from '../ui/spinner'
import TaskDescriptionEditor from './TaskDescriptionEditor'
import AttachmentField from '../fields/AttachmentField'
import { attachmentsSchema } from '#/schema/attachment.schema'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'
import { useParams } from '@tanstack/react-router'
import DateField from '../fields/DateField'

interface CreateTaskDialogProps {
  isDialogOpen: boolean
  setIsDialogOpen: React.Dispatch<SetStateAction<boolean>>
  trigger: ReactElement
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

const CreateTaskFormSchema = z
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
    attachments: attachmentsSchema,
    startDate: z.date().optional(),
    dueDate: z.date().optional(),
  })
  .refine(
    (data) =>
      !data.startDate || !data.dueDate || data.dueDate >= data.startDate,
    {
      message: 'Due date cannot be before start date',
      path: ['dueDate'],
    },
  )

export type CreateTaskFormPayload = z.infer<typeof CreateTaskFormSchema>

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

function CreateTaskDialog({
  trigger: dialogTrigger,
  isDialogOpen,
  setIsDialogOpen,
}: CreateTaskDialogProps) {
  const params = useParams({ strict: false }) as { workspaceId: string }

  // Mutation and queries
  const { mutateAsync: createTask, isPending } = useCreateTask()
  const { data: workspaceUsers } = useGetWorkspaceUsers(params.workspaceId)

  const { handleSubmit, control, reset, trigger } = useForm({
    resolver: zodResolver(CreateTaskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      assignee: '',
      reporter: '',
      label: 'feature',
      priority: 'medium',
      status: 'todo',
      attachments: [],
      startDate: undefined,
      dueDate: undefined,
    },
  })

  async function onSubmit(data: CreateTaskFormPayload) {
    await createTask({
      ...data,
      assignee: data.assignee === 'noassignee' ? undefined : data.assignee,
      reporter: data.reporter === 'noreporter' ? undefined : data.reporter,
      startDate: data.startDate?.toISOString(),
      dueDate: data.dueDate?.toISOString(),
    })
    // Manually close the dialog and reset the form
    reset()
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
            <DialogTitle>New task</DialogTitle>

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

            {/* Task Description */}
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Task Description</FieldLabel>
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
            {/* Attachments */}
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
                  />
                </Field>
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

            <div className="grid md:grid-cols-4 gap-2 grid-cols-2">
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

            <Button disabled={isPending} type="submit">
              {isPending && <Spinner />}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTaskDialog
