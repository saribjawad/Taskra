import {
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { isAxiosError } from 'axios'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import TaskDescriptionEditor from '#/components/tasks/TaskDescriptionEditor'
import { cn } from '#/lib/utils'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Spinner } from '#/components/ui/spinner'
import DateField from '#/components/fields/DateField'
import { PRIORITY_ITEMS } from '#/constants'
import { useCreateProject } from '#/hooks/project.hooks'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'
import { useAuth } from '#/context/auth/auth-hook'

const statusItems = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a project name')
    .max(80, 'Use 80 characters or fewer'),
  shortSummary: z.string().trim().max(255, 'Use 255 characters or fewer'),
  description: z.string().trim(),
  status: z.enum([
    'backlog',
    'planned',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  priority: z.enum(['urgent', 'high', 'medium', 'low', 'no_priority']),
  leadId: z.uuid('Choose a project lead'),
  startDate: z.date().optional(),
  targetDate: z.date().optional(),
})

type FormValues = z.infer<typeof schema>

export default function CreateProjectDialog({
  workspaceId,
  onCreated,
  isDialogOpen,
  setIsDialogOpen,
  trigger: dialogTrigger,
}: {
  workspaceId: string
  onCreated: () => void
  isDialogOpen: boolean
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>
  trigger: ReactElement
}) {
  const [expanded, setExpanded] = useState(false)
  const { user } = useAuth()
  const {
    data: members,
    isPending: loadingMembers,
    isError: membersError,
    refetch,
  } = useGetWorkspaceUsers(workspaceId)
  const { mutateAsync, isPending } = useCreateProject(workspaceId)
  const {
    trigger,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      shortSummary: '',
      description: '',
      status: 'backlog',
      priority: 'no_priority',
      leadId: '',
    },
  })
  const busy = isPending || isSubmitting
  const wrongWorkspace = user?.activeWorkspace !== workspaceId

  async function submit(data: FormValues) {
    if (busy || wrongWorkspace) return
    try {
      await mutateAsync({
        ...data,
        shortSummary: data.shortSummary || undefined,
        description: data.description || undefined,
        startDate: data.startDate?.toISOString(),
        targetDate: data.targetDate?.toISOString(),
      })
      reset()
      setIsDialogOpen(false)
      toast.success('Project created')
      onCreated()
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined
      setError('root', {
        message:
          typeof message === 'string'
            ? message
            : 'Unable to create the project. Please try again.',
      })
    }
  }

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(next) => {
        if (!busy) setIsDialogOpen(next)
      }}
    >
      <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex max-h-[85vh] flex-col min-w-[70vw] lg:min-w-[50vw]',
          expanded && 'min-w-[95vw] lg:min-w-[95vw] h-[95dvh] max-h-[95dvh]',
        )}
      >
        <DialogHeader>
          <div className="flex w-full items-center justify-between">
            <DialogTitle>New project</DialogTitle>
            <div className="flex items-center">
              <Button
                disabled={busy}
                variant="ghost"
                type="button"
                size="icon-sm"
                aria-label={expanded ? 'Restore dialog size' : 'Expand dialog'}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? <Minimize2 /> : <Maximize2 />}
              </Button>
              <DialogClose asChild>
                <Button
                  disabled={busy}
                  variant="ghost"
                  type="button"
                  size="icon-sm"
                  aria-label="Close dialog"
                >
                  <X />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(submit)}
          className="flex flex-1 min-h-0 flex-col"
        >
          <FieldGroup className="overflow-y-auto">
            {/* Name and summary */}
            {(['name', 'shortSummary'] as const).map((name) => (
              <Controller
                key={name}
                name={name}
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`project-${name}`}>
                      {name === 'name' ? 'Name' : 'Summary (optional)'}
                      {name === 'shortSummary' && (
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                      )}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`project-${name}`}
                      placeholder={
                        name === 'name'
                          ? 'What is the project called?'
                          : 'What is this project working toward?'
                      }
                      maxLength={name === 'name' ? 81 : 256}
                      disabled={busy}
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            ))}
            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Project description
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </FieldLabel>
                  <TaskDescriptionEditor
                    disabled={busy}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid grid-cols-2 gap-2">
              {/* Start date and target date */}
              {(['startDate', 'targetDate'] as const).map((name) => (
                <Controller
                  key={name}
                  name={name}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`project-${name}`}>
                        {name === 'startDate' ? 'Start date' : 'Target date'}{' '}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </FieldLabel>
                      <DateField
                        id={`project-${name}`}
                        value={field.value}
                        onChange={(date) => {
                          field.onChange(date)
                          if (name === 'startDate') void trigger('targetDate')
                        }}
                        disabled={busy}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {/* Status and priority */}
              {(['status', 'priority'] as const).map((name) => (
                <Controller
                  key={name}
                  name={name}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`project-${name}`}>
                        {name === 'status' ? 'Status' : 'Priority'}
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={busy}
                      >
                        <SelectTrigger
                          id={`project-${name}`}
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(name === 'status'
                            ? statusItems
                            : PRIORITY_ITEMS
                          ).map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              ))}
              {/* Project lead */}
              <Controller
                name="leadId"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="project-lead">Project lead</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={busy || loadingMembers || membersError}
                    >
                      <SelectTrigger
                        id="project-lead"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue
                          placeholder={
                            loadingMembers
                              ? 'Loading members…'
                              : 'Choose a workspace member'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {members?.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                    {membersError && (
                      <div role="alert" className="text-sm text-destructive">
                        Unable to load members.{' '}
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => void refetch()}
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                    {!loadingMembers && !membersError && !members?.length && (
                      <p className="text-sm text-muted-foreground">
                        No workspace members available.
                      </p>
                    )}
                  </Field>
                )}
              />
            </div>
            {errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.message}
              </p>
            )}
            {wrongWorkspace && (
              <p role="alert" className="text-sm text-destructive">
                Switch to this workspace before creating a project.
              </p>
            )}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                busy ||
                wrongWorkspace ||
                loadingMembers ||
                membersError ||
                !members?.length
              }
            >
              {busy && <Spinner />}Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
