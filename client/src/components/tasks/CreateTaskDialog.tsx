import { useState, type ReactElement } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Maximize2, X } from 'lucide-react'
import z from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../ui/field'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
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

interface CreateTaskDialogProps {
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

const CreateTaskFormSchema = z.object({
  title: z
    .string('Invalid title')
    .min(1, 'Title is required')
    .max(250, 'Title cannot be more than 250 words'),
  description: z.string().min(1, 'Description is required'),
  status: Status,
  priority: Priority,
  label: Label,
  assignee: z.string('Invalid assignee').optional(),
})

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

const tempAssigneeItems = [
  { label: 'Ali', value: '550e8400-e29b-41d4-a716-446655440000' },
  { label: 'Arthur', value: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
  { label: 'Someone', value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
]

function CreateTaskDialog({ trigger }: CreateTaskDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>()

  const { mutate: createTask, isPending } = useCreateTask()
  const { handleSubmit, control, reset } = useForm({
    resolver: zodResolver(CreateTaskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      assignee: '',
      label: 'feature',
      priority: 'medium',
      status: 'todo',
    },
  })

  function onSubmit(data: CreateTaskFormPayload) {
    createTask({
      ...data,
      assignee: data.assignee === '' ? undefined : data.assignee,
    })
    // Manually close the dialog and reset the form
    reset()
    setIsDialogOpen(false)
  }

  return (
    <Dialog open={isDialogOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent showCloseButton={false} className="min-w-[35vw]">
        {/* Header */}
        <DialogHeader>
          <div className="w-full  flex items-center justify-between">
            {/* Title */}
            <DialogTitle>New task</DialogTitle>

            {/* Button */}
            <div>
              <Button variant="ghost" type="button" size="icon-sm">
                <Maximize2 />
              </Button>
              <DialogClose>
                <Button variant="ghost" type="button" size="icon-sm">
                  <X />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-10"
        >
          <FieldGroup>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                  <Input
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
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Add more details, links, acceptance criteria, or any relevant context..."
                    autoComplete="off"
                    className="h-44"
                  />
                  <FieldDescription className="text-xs">
                    Provide enough context so anyone on the team can understand
                    and complete the task.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-2">
              <Controller
                name="status"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Status</FieldLabel>

                    <Select value={field.value} onValueChange={field.onChange}>
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

                    <Select value={field.value} onValueChange={field.onChange}>
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

                    <Select value={field.value} onValueChange={field.onChange}>
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

                    <Select value={field.value} onValueChange={field.onChange}>
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
                          {tempAssigneeItems.map((item) => (
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
            </div>
          </FieldGroup>
          <div className="self-end flex items-center gap-2">
            <DialogClose>
              <Button variant="secondary" className="self-end" type="button">
                Close
              </Button>
            </DialogClose>
            {/* TODO: add proper spinner and disabled fields */}
            <Button type="submit">{isPending ? 'Creating' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTaskDialog
