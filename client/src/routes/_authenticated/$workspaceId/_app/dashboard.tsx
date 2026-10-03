import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  ListChecks,
  RefreshCw,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { PageLayout } from '#/components/layout/PageLayout'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { useGetWorkspaceDashboard } from '#/hooks/workspace.hooks'
import type { DashboardTaskSummary } from '#/type/dashboard'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/dashboard',
)({ component: DashboardPage })

type TrendRange = 7 | 30 | 90

function DashboardPage() {
  const { workspaceId } = Route.useParams()
  const { data, isPending, isError, refetch, isFetching } =
    useGetWorkspaceDashboard(workspaceId)
  const [range, setRange] = useState<TrendRange>(30)

  if (isPending) return <DashboardLoading />

  if (isError || !data) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <CircleAlert className="mb-3 size-5 text-muted-foreground" />
          <p className="font-medium">Couldn’t load your dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check your connection and try again.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </PageLayout>
    )
  }

  const summary = data.summary
  const completionChange = summary.completedThisWeek - summary.completedLastWeek
  const trend = data.completionTrend.slice(-range)

  return (
    <PageLayout
      title="Dashboard"
      actions={
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6 pb-10 flex-1">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<ListChecks className="size-4" />}
            label="Created this week"
            value={summary.createdThisWeek}
            detail="Since the start of this week"
            tone="neutral"
          />
          <MetricCard
            icon={<Check className="size-4" />}
            label="Completed this week"
            value={summary.completedThisWeek}
            detail={`${completionChange > 0 ? '+' : ''}${completionChange} from last week`}
            trend={completionChange >= 0 ? 'up' : 'down'}
            tone="indigo"
          />
          <MetricCard
            icon={<CircleAlert className="size-4" />}
            label="Overdue tasks"
            value={summary.overdueTaskCount}
            detail={`${summary.overdueHighPriorityCount} urgent or high priority`}
            tone={summary.overdueTaskCount ? 'red' : 'neutral'}
          />
          <MetricCard
            icon={<CalendarClock className="size-4" />}
            label="Due in the next 7 days"
            value={summary.upcomingDeadlineCount}
            detail={`Across ${summary.upcomingProjectCount} ${summary.upcomingProjectCount === 1 ? 'project' : 'projects'}`}
            tone="neutral"
          />
        </section>

        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-indigo-400" />
                <h2 className="font-semibold">Task completion</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Completed tasks over the last {range} days
              </p>
            </div>
            <div className="flex rounded-lg border p-0.5">
              {([7, 30, 90] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRange(days)}
                  className={`rounded-md px-3 py-1.5 text-xs transition-colors ${range === days ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  aria-pressed={range === days}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>
          <CompletionChart points={trend} />
        </section>

        <TaskStatusBreakdown statuses={data.taskStatusBreakdown} />

        <section className="grid gap-6 lg:grid-cols-2">
          <TaskList
            title="Overdue"
            subtitle={`${summary.overdueTaskCount} open ${summary.overdueTaskCount === 1 ? 'task' : 'tasks'} past due`}
            icon={<Clock3 className="size-4 text-rose-400" />}
            tasks={data.overdueTasks}
            total={summary.overdueTaskCount}
            workspaceId={workspaceId}
            empty="No overdue tasks. You’re all caught up."
          />
          <TaskList
            title="Upcoming deadlines"
            subtitle={`${summary.upcomingDeadlineCount} open ${summary.upcomingDeadlineCount === 1 ? 'task' : 'tasks'} due this week`}
            icon={<CalendarClock className="size-4 text-sky-400" />}
            tasks={data.upcomingDeadlines}
            total={summary.upcomingDeadlineCount}
            workspaceId={workspaceId}
            empty="No deadlines coming up this week."
          />
        </section>
      </div>
    </PageLayout>
  )
}

const STATUS_PRESENTATION = {
  backlog: { label: 'Backlog', color: 'bg-slate-500', dot: 'bg-slate-400' },
  todo: { label: 'To do', color: 'bg-sky-500', dot: 'bg-sky-400' },
  in_progress: {
    label: 'In progress',
    color: 'bg-indigo-500',
    dot: 'bg-indigo-400',
  },
  done: { label: 'Done', color: 'bg-emerald-500', dot: 'bg-emerald-400' },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-zinc-600',
    dot: 'bg-zinc-500',
  },
} as const

function TaskStatusBreakdown({
  statuses,
}: {
  statuses: {
    status: keyof typeof STATUS_PRESENTATION
    count: number
  }[]
}) {
  const total = statuses.reduce((sum, item) => sum + item.count, 0)

  return (
    <section className="rounded-xl border bg-card px-5 py-4 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Tasks by status</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? 'task' : 'tasks'} across this workspace
          </p>
        </div>
        <ListChecks className="mt-1 size-4 text-muted-foreground" />
      </div>

      <div
        className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-secondary"
        role="img"
        aria-label={statuses
          .map(
            ({ status, count }) =>
              `${STATUS_PRESENTATION[status].label}: ${count}`,
          )
          .join(', ')}
      >
        {statuses.map(({ status, count }) =>
          count ? (
            <span
              key={status}
              className={STATUS_PRESENTATION[status].color}
              style={{ width: `${(count / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
        {statuses.map(({ status, count }) => (
          <div key={status} className="flex min-w-0 items-center gap-2">
            <span
              className={`size-2 shrink-0 rounded-full ${STATUS_PRESENTATION[status].dot}`}
            />
            <span className="truncate text-xs text-muted-foreground">
              {STATUS_PRESENTATION[status].label}
            </span>
            <span className="ml-auto text-sm font-medium tabular-nums">
              {count}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  trend,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  detail: string
  trend?: 'up' | 'down'
  tone: 'indigo' | 'red' | 'neutral'
}) {
  const toneClass = {
    indigo: 'text-indigo-400 bg-indigo-400/10',
    red: 'text-rose-400 bg-rose-400/10',
    neutral: 'text-muted-foreground bg-secondary',
  }[tone]

  return (
    <article className="rounded-xl border bg-card px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={`grid size-8 place-items-center rounded-lg ${toneClass}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight">{value}</span>
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        {trend === 'up' && (
          <ArrowUpRight className="size-3.5 text-emerald-400" />
        )}
        {trend === 'down' && (
          <ArrowDownRight className="size-3.5 text-rose-400" />
        )}
        {detail}
      </p>
    </article>
  )
}

function CompletionChart({
  points,
}: {
  points: { date: string; count: number }[]
}) {
  const chart = useMemo(() => {
    if (!points.length) return null
    const width = 900
    const height = 250
    const left = 28
    const right = 16
    const top = 20
    const bottom = 36
    const max = Math.max(1, ...points.map((point) => point.count))
    const usableWidth = width - left - right
    const usableHeight = height - top - bottom
    const coords = points.map((point, index) => ({
      ...point,
      x:
        left +
        (points.length === 1
          ? usableWidth / 2
          : (index / (points.length - 1)) * usableWidth),
      y: top + usableHeight - (point.count / max) * usableHeight,
    }))
    return {
      coords,
      line: coords
        .map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`)
        .join(' '),
      area: `${coords[0].x},${height - bottom} ${coords.map((point) => `${point.x},${point.y}`).join(' ')} ${coords.at(-1)?.x},${height - bottom}`,
      width,
      height,
      top,
      bottom,
      left,
      right,
      max,
    }
  }, [points])

  if (!chart)
    return (
      <div className="px-6 py-14 text-center text-sm text-muted-foreground">
        No completion data yet.
      </div>
    )

  const labelIndexes = [
    ...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
  ]

  return (
    <div className="px-4 pb-3 pt-5 sm:px-6">
      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        className="h-56 w-full overflow-visible"
        role="img"
        aria-label="Daily completed task trend"
      >
        {[0, 0.5, 1].map((fraction) => {
          const y =
            chart.top + (chart.height - chart.top - chart.bottom) * fraction
          return (
            <line
              key={fraction}
              x1={chart.left}
              x2={chart.width - chart.right}
              y1={y}
              y2={y}
              className="stroke-border"
              strokeDasharray="3 6"
            />
          )
        })}
        <polygon points={chart.area} fill="url(#trendFill)" />
        <path
          d={chart.line}
          fill="none"
          stroke="rgb(129 140 248)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {chart.coords.map((point) => (
          <circle
            key={point.date}
            cx={point.x}
            cy={point.y}
            r="2.2"
            fill="rgb(129 140 248)"
          />
        ))}
        {labelIndexes.map((index) => {
          const point = chart.coords[index]
          return (
            <text
              key={point.date}
              x={point.x}
              y={chart.height - 8}
              textAnchor={
                index === 0
                  ? 'start'
                  : index === points.length - 1
                    ? 'end'
                    : 'middle'
              }
              className="fill-muted-foreground"
              fontSize="12"
            >
              {format(parseISO(point.date), 'MMM d')}
            </text>
          )
        })}
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(129 140 248)" stopOpacity="0.22" />
            <stop
              offset="100%"
              stopColor="rgb(129 140 248)"
              stopOpacity="0.01"
            />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function TaskList({
  title,
  subtitle,
  icon,
  tasks,
  total,
  workspaceId,
  empty,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  tasks: DashboardTaskSummary[]
  total: number
  workspaceId: string
  empty: string
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5">{icon}</span>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {total > tasks.length && (
          <span className="text-xs text-muted-foreground">
            Showing {tasks.length} of {total}
          </span>
        )}
      </header>
      {tasks.length ? (
        <div className="divide-y">
          {tasks.map((task) => (
            <Link
              key={task.id}
              to="/$workspaceId/tasks/$taskId"
              params={{ workspaceId, taskId: task.id }}
              search={{ from: 'all' }}
              className="group flex min-w-0 items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-secondary text-[11px] font-medium text-muted-foreground">
                {task.assigneeName?.slice(0, 1).toUpperCase() ?? '–'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium group-hover:text-foreground">
                  {task.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {task.projectName ?? 'No project'}
                  {task.assigneeName ? ` · ${task.assigneeName}` : ''}
                </span>
              </span>
              <span
                className={`shrink-0 text-xs ${title === 'Overdue' ? 'text-rose-400' : 'text-muted-foreground'}`}
              >
                {format(parseISO(task.dueDate), 'MMM d')}
              </span>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      ) : (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      )}
    </section>
  )
}

function DashboardLoading() {
  return (
    <PageLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
