import type { TaskLabelType, TaskPriorityType, TaskStatusType } from '#/type'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'

interface TaskCardProps {
  id: string
  title: string
  status: TaskStatusType
  priority: TaskPriorityType
  label: TaskLabelType
  assignee: string
  created_at: Date
}

function TaskCard(props: TaskCardProps) {
  return (
    <div
      key={props.id}
      className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">{props.title}</h3>
        </div>
        {/* TODO: improve the badge */}
        <Badge>{props.status}</Badge>
      </div>

      <Separator className="my-3" />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {/* TODO: improve the badge */}
        <Badge variant="secondary">{props.priority}</Badge>

        {/* TODO: improve the badge */}
        <Badge variant="outline">{props.label}</Badge>

        <span>Assigned: {props.assignee}</span>

        <span className="ml-auto">
          Created {new Date(props.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

export default TaskCard
