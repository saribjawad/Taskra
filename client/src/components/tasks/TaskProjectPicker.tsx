import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Box, Check, CircleDashed, Diamond, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { getProjects } from '#/service/project.service'
import { useGetProject } from '#/hooks/project.hooks'
import { useConnectTaskToProject } from '#/hooks/task.hook'

export default function TaskProjectPicker({
  taskId,
  workspaceId,
  projectId,
  milestoneId,
  disabled,
}: {
  taskId: string
  workspaceId: string
  projectId: string | null
  milestoneId: string | null
  disabled: boolean
}) {
  const [projectOpen, setProjectOpen] = useState(false)
  const [milestoneOpen, setMilestoneOpen] = useState(false)
  const [search, setSearch] = useState('')

  const projects = useInfiniteQuery({
    queryKey: ['projects', workspaceId, 'picker'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getProjects(workspaceId, pageParam, 30),
    getNextPageParam: (page) =>
      page.metadata.hasNextPage ? page.metadata.page + 1 : undefined,
    enabled: projectOpen,
  })

  const project = useGetProject(workspaceId, projectId ?? '')
  const { mutateAsync: connect, isPending } = useConnectTaskToProject(taskId)

  const milestone = project.data?.milestones.find(
    (item) => item.id === milestoneId,
  )
  const visibleProjects =
    projects.data?.pages
      .flatMap((page) => page.projects)
      .filter((item) =>
        item.name.toLowerCase().includes(search.trim().toLowerCase()),
      ) ?? []

  async function save(nextProjectId: string | null, nextMilestoneId?: string) {
    if (isPending) return
    if (
      nextProjectId === projectId &&
      (nextMilestoneId ?? null) === milestoneId
    ) {
      setProjectOpen(false)
      setMilestoneOpen(false)
      return
    }
    try {
      // Omitting the milestone clears it when moving the task to another project.
      await connect({
        projectId: nextProjectId,
        ...(nextMilestoneId && { milestoneId: nextMilestoneId }),
      })
      setProjectOpen(false)
      setMilestoneOpen(false)
    } catch {
      toast.error('Unable to update the task’s project. Please try again.')
    }
  }

  return (
    <section
      className="rounded-xl border bg-muted/20 p-4"
      aria-label="Task project"
    >
      <h2 className="mb-3 text-sm font-medium">Project</h2>
      <Popover
        open={projectOpen}
        onOpenChange={(open) => {
          if (!isPending) {
            setProjectOpen(open)
            setSearch('')
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || isPending}
            aria-label="Change task project"
            className="-ml-2 h-7 max-w-full justify-start gap-2 rounded-full px-2 text-xs font-normal"
          >
            <Box
              className={
                projectId
                  ? 'size-3.5 shrink-0 text-emerald-500'
                  : 'size-3.5 shrink-0 text-muted-foreground'
              }
            />
            <span className="truncate">
              {projectId
                ? (project.data?.name ??
                  (project.isError
                    ? 'Project unavailable'
                    : 'Loading project…'))
                : 'Add to project'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-64 gap-0 overflow-hidden p-0"
        >
          <div className="relative border-b">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              aria-label="Search projects"
              placeholder="Search projects…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 rounded-none border-0 bg-transparent pl-9 text-xs shadow-none"
            />
          </div>
          <div className="border-b p-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => void save(null)}
              aria-pressed={!projectId}
              className="h-8 w-full justify-start gap-2 text-xs font-normal"
            >
              <CircleDashed className="size-3.5 shrink-0 text-muted-foreground" />
              No project
              {!projectId && <Check className="ml-auto size-3.5" />}
            </Button>
          </div>
          <p className="px-3 py-2 text-xs text-muted-foreground">
            Workspace projects
          </p>
          <div className="max-h-64 overflow-y-auto p-1">
            {projects.isPending ? (
              <p className="p-2 text-xs text-muted-foreground">
                Loading projects…
              </p>
            ) : projects.isError ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void projects.refetch()}
              >
                Unable to load. Retry
              </Button>
            ) : (
              <>
                {visibleProjects.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      void save(
                        item.id,
                        item.id === projectId
                          ? (milestoneId ?? undefined)
                          : undefined,
                      )
                    }
                    className="h-8 w-full justify-start gap-2 text-xs font-normal"
                    aria-pressed={item.id === projectId}
                  >
                    <Box className="size-3.5 shrink-0 text-emerald-500" />
                    <span className="truncate">{item.name}</span>
                    {item.id === projectId && (
                      <Check className="ml-auto size-3.5 shrink-0" />
                    )}
                  </Button>
                ))}
                {!visibleProjects.length && (
                  <p className="p-2 text-xs text-muted-foreground">
                    {projects.hasNextPage
                      ? 'No matches in loaded projects.'
                      : 'No projects found.'}
                  </p>
                )}
                {projects.hasNextPage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    disabled={projects.isFetchingNextPage}
                    onClick={() => void projects.fetchNextPage()}
                  >
                    {projects.isFetchingNextPage
                      ? 'Loading…'
                      : 'Load more projects'}
                  </Button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {projectId && (
        <div className="ml-2 border-l pl-3 pt-1">
          <Popover
            open={milestoneOpen}
            onOpenChange={(open) => {
              if (!isPending) setMilestoneOpen(open)
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Change task milestone"
                disabled={disabled || isPending}
                className="h-7 max-w-full justify-start gap-2 rounded-full px-2 text-xs font-normal text-muted-foreground"
              >
                <Diamond className="size-3 shrink-0" />
                <span className="truncate">
                  {milestone?.name ?? 'Set milestone'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 gap-1 p-1">
              {project.isPending ? (
                <p className="p-3 text-xs">Loading milestones…</p>
              ) : project.isError ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void project.refetch()}
                >
                  Unable to load. Retry
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => void save(projectId)}
                    className="w-full justify-start text-xs font-normal"
                  >
                    No milestone{' '}
                    {!milestoneId && <Check className="ml-auto size-3.5" />}
                  </Button>
                  {project.data?.milestones.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => void save(projectId, item.id)}
                      className="w-full justify-start gap-2 text-xs font-normal"
                      aria-pressed={item.id === milestoneId}
                    >
                      <Diamond className="size-3 shrink-0" />
                      <span className="truncate">{item.name}</span>
                      {item.id === milestoneId && (
                        <Check className="ml-auto size-3.5 shrink-0" />
                      )}
                    </Button>
                  ))}
                  {!project.data?.milestones.length && (
                    <p className="p-3 text-xs text-muted-foreground">
                      No milestones in this project yet.
                    </p>
                  )}
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </section>
  )
}
