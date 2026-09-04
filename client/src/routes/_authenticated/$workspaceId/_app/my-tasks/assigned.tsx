import TaskListView, {
  parseTaskListSearch,
} from '#/components/tasks/TaskListView'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/my-tasks/assigned',
)({
  validateSearch: parseTaskListSearch,
  component: RouteComponent,
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <TaskListView
      filter="assigned"
      search={search}
      onSearchChange={(nextSearch) => {
        navigate({
          search: {
            ...search,
            ...nextSearch,
          },
        })
      }}
      emptyMessage="No tasks assigned to you."
    />
  )
}
