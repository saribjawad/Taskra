import { useState, type ReactNode } from 'react'
import type { Matcher } from 'react-day-picker'
import ProjectMemberPicker from './ProjectMemberPicker'
import ProjectLeadPicker from './ProjectLeadPicker'
import {
  CalendarDays,
  Check,
  CircleAlert,
  Ellipsis,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ProjectDetail } from '#/type/project'
import { PRIORITY_ITEMS } from '#/constants'
import { cn } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import { Calendar } from '#/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { useUpdateProject } from '#/hooks/project.hooks'
import { formatProjectDate, projectStatuses } from './project-presentation'

const priorityIcons = {
  low: SignalLow,
  medium: SignalMedium,
  high: SignalHigh,
  urgent: CircleAlert,
  no_priority: Ellipsis,
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-3 py-2 ">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 wrap-break-word">{children}</dd>
    </div>
  )
}

export default function ProjectProperties({
  project,
}: {
  project: ProjectDetail
}) {
  const status = projectStatuses[project.status]
  const priority = PRIORITY_ITEMS.find(
    (item) => item.value === project.priority,
  )?.label
  const PriorityIcon = priorityIcons[project.priority]
  const { mutateAsync: updateProject, isPending } = useUpdateProject(
    project.workspace_id,
    project.id,
  )

  async function saveProject(payload: Parameters<typeof updateProject>[0]) {
    try {
      await updateProject(payload)
      return true
    } catch {
      toast.error('Unable to update project. Please try again.')
      return false
    }
  }

  return (
    <section
      aria-labelledby="project-properties"
      className="rounded-xl border bg-muted/20 p-4"
    >
      <h2 id="project-properties" className="mb-3 text-sm font-medium">
        Properties
      </h2>
      <dl className="text-xs leading-5">
        {/* Project status and priority */}
        <Property label="Status">
          <PropertyPicker
            label="Change status"
            disabled={isPending}
            trigger={
              <span className="flex items-center gap-2">
                <span className={cn('size-2 rounded-full', status.color)} />
                {status.label}
              </span>
            }
          >
            {Object.entries(projectStatuses).map(([value, item]) => (
              <PickerOption
                key={value}
                selected={project.status === value}
                onClick={() =>
                  void saveProject({ status: value as ProjectDetail['status'] })
                }
              >
                <span className={cn('size-2 rounded-full', item.color)} />
                {item.label}
              </PickerOption>
            ))}
          </PropertyPicker>
        </Property>
        <Property label="Priority">
          <PropertyPicker
            label="Change priority"
            disabled={isPending}
            trigger={
              <span className="flex items-center gap-2">
                <PriorityIcon className="size-3.5 text-muted-foreground" />
                {priority}
              </span>
            }
          >
            {PRIORITY_ITEMS.map((item) => {
              const Icon = priorityIcons[item.value]
              return (
                <PickerOption
                  key={item.value}
                  selected={project.priority === item.value}
                  onClick={() => void saveProject({ priority: item.value })}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {item.label}
                </PickerOption>
              )
            })}
          </PropertyPicker>
        </Property>
        {/* People returned by the project API */}
        <Property label="Lead">
          <ProjectLeadPicker
            project={project}
            disabled={isPending}
            onSelect={(leadId) => saveProject({ leadId })}
          />
        </Property>
        <Property label="Members">
          <ProjectMemberPicker project={project} />
        </Property>
        {/* Project timeline */}
        <Property label="Start date">
          <DatePicker
            label="Change start date"
            value={project.start_date}
            disabled={isPending}
            latestDate={project.target_date}
            onChange={(date) =>
              void saveProject({ startDate: date.toISOString() })
            }
          />
        </Property>
        <Property label="Target date">
          <DatePicker
            label="Change target date"
            value={project.target_date}
            disabled={isPending}
            earliestDate={project.start_date}
            onChange={(date) =>
              void saveProject({ targetDate: date.toISOString() })
            }
          />
        </Property>
      </dl>
    </section>
  )
}

function PropertyPicker({
  label,
  trigger,
  children,
  disabled,
}: {
  label: string
  trigger: ReactNode
  children: ReactNode
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="-ml-2 h-auto max-w-full justify-start px-2 py-0.5 text-xs font-normal"
        >
          {trigger}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-52 gap-0 p-1.5"
        aria-label={label}
        onClick={() => setOpen(false)}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

function PickerOption({
  selected,
  children,
  onClick,
}: {
  selected: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-8 w-full justify-start gap-2 px-2 text-xs font-normal"
      onClick={onClick}
    >
      {children}
      <Check className={cn('ml-auto size-3.5', !selected && 'invisible')} />
    </Button>
  )
}

function DatePicker({
  label,
  value,
  disabled,
  earliestDate,
  latestDate,
  onChange,
}: {
  label: string
  value: string | null
  disabled: boolean
  earliestDate?: string | null
  latestDate?: string | null
  onChange: (date: Date) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(value) : undefined
  const unavailableDates: Matcher[] = [
    ...(earliestDate ? [{ before: new Date(earliestDate) }] : []),
    ...(latestDate ? [{ after: new Date(latestDate) }] : []),
  ]
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="-ml-2 h-auto max-w-full justify-start gap-2 px-2 py-0.5 text-xs font-normal"
        >
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
          {formatProjectDate(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0" aria-label={label}>
        <Calendar
          mode="single"
          selected={selected}
          disabled={unavailableDates}
          onSelect={(date) => {
            if (date) {
              onChange(date)
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
