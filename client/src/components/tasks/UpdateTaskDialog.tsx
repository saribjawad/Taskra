import { useState, type ReactElement } from 'react'
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
import { useUpdateTask } from '#/hooks/task.hook'
// import { useUpdateTask } from '#/hooks/task.hook'

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
  }
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

const EditTaskFormSchema = z.object({
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

export type EditTaskFormPayload = z.infer<typeof EditTaskFormSchema>

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

function EditTaskDialog({ trigger, task }: EditTaskDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>()

  const { mutate: updateTask, isPending } = useUpdateTask()
  const { handleSubmit, control, reset } = useForm({
    resolver: zodResolver(EditTaskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      assignee: task.assignee?.id ?? '',
      label: task.label as z.infer<typeof Label>,
      priority: task.priority as z.infer<typeof Priority>,
      status: task.status as z.infer<typeof Status>,
    },
  })

  function onSubmit(data: EditTaskFormPayload) {
    updateTask({
      taskId: task.id,
      payload: {
        ...data,
        assignee: data.assignee === '' ? undefined : data.assignee,
      },
    })
    // Manually close the dialog and reset the form
    reset(data)
    setIsDialogOpen(false)
  }

  return (
    <Dialog open={isDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent showCloseButton={false} className="min-w-[35vw]">
        {/* Header */}
        <DialogHeader>
          <div className="w-full  flex items-center justify-between">
            {/* Title */}
            <DialogTitle>Edit task</DialogTitle>

            {/* Button */}
            <div>
              <Button variant="ghost" type="button" size="icon-sm">
                <Maximize2 />
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" type="button" size="icon-sm">
                  <X />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
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

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>

            {/* TODO: add proper spinner and disabled fields */}
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditTaskDialog
