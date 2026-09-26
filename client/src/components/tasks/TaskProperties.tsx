import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  AlertCircle,
  CalendarDays,
  Check,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleX,
  Search,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Calendar } from '#/components/ui/calendar'
import { Input } from '#/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { LABEL_ITEMS, PRIORITY_ITEMS, STATUS_ITEMS } from '#/constants'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'
import { useUpdateTask } from '#/hooks/task.hook'
import {
  avatarColor,
  cn,
  formatDate,
  formatLabel,
  getInitials,
} from '#/lib/utils'
import type { GetTaskResponse, UpdateTaskPayload } from '#/service/task.service'
import type { TaskLabelType, TaskPriorityType, TaskStatusType } from '#/type'

const statusIcons = {
  backlog: CircleDashed,
  todo: Circle,
  in_progress: CircleDot,
  done: CircleCheck,
  cancelled: CircleX,
}

const priorityIcons = {
  urgent: AlertCircle,
  high: SignalHigh,
  medium: SignalMedium,
  low: SignalLow,
  no_priority: Circle,
}

function Property({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 py-2 text-xs leading-5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

function PickerOption({
  selected,
  children,
  onSelect,
}: {
  selected: boolean
  children: React.ReactNode
  onSelect: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-8 w-full justify-start gap-2 px-2 text-xs font-normal"
      onClick={onSelect}
    >
      {children}
      <Check className={cn('ml-auto size-3.5', !selected && 'invisible')} />
    </Button>
  )
}

function PropertyPicker({
  label,
  trigger,
  disabled,
  children,
}: {
  label: string
  trigger: React.ReactNode
  disabled: boolean
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label={label}
          className="-ml-2 h-auto max-w-full justify-start gap-2 px-2 py-0.5 text-xs font-normal"
        >
          {trigger}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 gap-0 p-1.5"
        aria-label={label}
      >
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  )
}

function PersonValue({ name, email }: { name?: string; email?: string }) {
  return name ? (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar className="size-5">
        <AvatarFallback
          className={cn('text-[9px] text-white', avatarColor(name))}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate" title={email}>
        {name}
      </span>
    </span>
  ) : (
    <span className="text-muted-foreground">Unassigned</span>
  )
}

export default function TaskProperties({
  task,
  workspaceId,
  disabled = false,
}: {
  task: GetTaskResponse
  workspaceId: string
  disabled?: boolean
}) {
  const { data: users, isPending: usersPending } =
    useGetWorkspaceUsers(workspaceId)
  const { mutateAsync: updateTask, isPending } = useUpdateTask()
  const locked = disabled || isPending

  async function save(payload: UpdateTaskPayload) {
    try {
      await updateTask({ taskId: task.id, payload })
    } catch {
      toast.error('Unable to update task. Please try again.')
      throw new Error('Task update failed')
    }
  }

  function peopleProperty(field: 'assignee' | 'reporter', label: string) {
    const person = task[field]
    return (
      <Property key={field} label={label}>
        <PropertyPicker
          label={`Change ${label.toLowerCase()}`}
          disabled={locked}
          trigger={
            <PersonValue name={person?.username} email={person?.email} />
          }
        >
          {(close) => (
            <PeopleOptions
              users={users ?? []}
              loading={usersPending}
              selectedId={person?.id}
              onSelect={async (userId) => {
                try {
                  await save(
                    userId ? { [field]: userId } : { clearFields: [field] },
                  )
                  close()
                } catch {
                  // Keep the picker open so the user can retry.
                }
              }}
            />
          )}
        </PropertyPicker>
      </Property>
    )
  }

  const StatusIcon = statusIcons[task.status]
  const PriorityIcon = priorityIcons[task.priority]
  const selectedLabel = LABEL_ITEMS.find((item) => item.value === task.label)

  return (
    <section
      className="rounded-xl border bg-muted/20 p-4"
      aria-label="Task properties"
    >
      <h2 className="mb-3 text-sm font-medium">Properties</h2>
      <dl>
        {peopleProperty('assignee', 'Assignee')}
        {peopleProperty('reporter', 'Reporter')}
        <Property label="Status">
          <PropertyPicker
            label="Change status"
            disabled={locked}
            trigger={
              <span className="flex items-center gap-2">
                <StatusIcon className="size-3.5 text-muted-foreground" />
                {formatLabel(task.status)}
              </span>
            }
          >
            {(close) =>
              STATUS_ITEMS.map((item) => {
                const Icon = statusIcons[item.value]
                return (
                  <PickerOption
                    key={item.value}
                    selected={task.status === item.value}
                    onSelect={() => {
                      void save({ status: item.value as TaskStatusType })
                        .then(close)
                        .catch(() => {})
                    }}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {item.label}
                  </PickerOption>
                )
              })
            }
          </PropertyPicker>
        </Property>
        <Property label="Priority">
          <PropertyPicker
            label="Change priority"
            disabled={locked}
            trigger={
              <span className="flex items-center gap-2">
                <PriorityIcon className="size-3.5 text-muted-foreground" />
                {
                  PRIORITY_ITEMS.find((item) => item.value === task.priority)
                    ?.label
                }
              </span>
            }
          >
            {(close) =>
              PRIORITY_ITEMS.map((item) => {
                const Icon = priorityIcons[item.value]
                return (
                  <PickerOption
                    key={item.value}
                    selected={task.priority === item.value}
                    onSelect={() => {
                      void save({ priority: item.value as TaskPriorityType })
                        .then(close)
                        .catch(() => {})
                    }}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {item.label}
                  </PickerOption>
                )
              })
            }
          </PropertyPicker>
        </Property>
        <Property label="Label">
          <PropertyPicker
            label="Change label"
            disabled={locked}
            trigger={selectedLabel?.label ?? 'No label'}
          >
            {(close) =>
              LABEL_ITEMS.map((item) => (
                <PickerOption
                  key={item.value}
                  selected={task.label === item.value}
                  onSelect={() => {
                    void save({ label: item.value as TaskLabelType })
                      .then(close)
                      .catch(() => {})
                  }}
                >
                  {item.label}
                </PickerOption>
              ))
            }
          </PropertyPicker>
        </Property>
        <Property label="Start date">
          <TaskDatePicker
            label="Change start date"
            value={task.start_date}
            disabled={locked}
            latestDate={task.due_date}
            onSelect={(date) => save({ startDate: format(date, 'yyyy-MM-dd') })}
          />
        </Property>
        <Property label="Due date">
          <TaskDatePicker
            label="Change due date"
            value={task.due_date}
            disabled={locked}
            earliestDate={task.start_date}
            onSelect={(date) => save({ dueDate: format(date, 'yyyy-MM-dd') })}
          />
        </Property>
        <Property label="Completed">{formatDate(task.completed_date)}</Property>
        <Property label="Created">{formatDate(task.created_at)}</Property>
        <Property label="Updated">{formatDate(task.updated_at)}</Property>
      </dl>
    </section>
  )
}

function PeopleOptions({
  users,
  loading,
  selectedId,
  onSelect,
}: {
  users: { id: string; username: string; email: string }[]
  loading: boolean
  selectedId?: string
  onSelect: (userId: string | null) => void
}) {
  const [search, setSearch] = useState('')
  const visibleUsers = users.filter((user) =>
    `${user.username} ${user.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )

  return (
    <>
      <div className="relative border-b">
        <Search className="pointer-events-none absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search members…"
          aria-label="Search workspace members"
          className="h-8 border-0 bg-transparent pl-8 text-xs shadow-none"
        />
      </div>
      <div className="max-h-56 overflow-y-auto py-1">
        <PickerOption selected={!selectedId} onSelect={() => onSelect(null)}>
          Unassigned
        </PickerOption>
        {loading ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            Loading members…
          </p>
        ) : visibleUsers.length ? (
          visibleUsers.map((user) => (
            <PickerOption
              key={user.id}
              selected={selectedId === user.id}
              onSelect={() => onSelect(user.id)}
            >
              <PersonValue name={user.username} email={user.email} />
            </PickerOption>
          ))
        ) : (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            No members found.
          </p>
        )}
      </div>
    </>
  )
}

function TaskDatePicker({
  label,
  value,
  disabled,
  earliestDate,
  latestDate,
  onSelect,
}: {
  label: string
  value: string | null
  disabled: boolean
  earliestDate?: string | null
  latestDate?: string | null
  onSelect: (date: Date) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value.slice(0, 10)) : undefined
  const unavailableDates = [
    ...(earliestDate ? [{ before: parseISO(earliestDate.slice(0, 10)) }] : []),
    ...(latestDate ? [{ after: parseISO(latestDate.slice(0, 10)) }] : []),
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label={label}
          className="-ml-2 h-auto max-w-full justify-start gap-2 px-2 py-0.5 text-xs font-normal"
        >
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
          {value ? formatDate(parseISO(value.slice(0, 10))) : 'Set date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0" aria-label={label}>
        <Calendar
          mode="single"
          selected={selected}
          disabled={unavailableDates}
          onSelect={(date) => {
            if (!date) return
            void onSelect(date)
              .then(() => setOpen(false))
              .catch(() => {})
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
