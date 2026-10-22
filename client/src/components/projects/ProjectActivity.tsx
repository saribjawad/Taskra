import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  ActivityEventRow,
  ActivityEventSkeleton,
} from '#/components/activity/ActivityEventRow'
import DeleteCommentDialog from '#/components/comments/DeleteCommentDialog'
import UpdateCommentDialog from '#/components/comments/UpdateCommentDialog'
import ProjectPersonAvatar from '#/components/projects/ProjectPersonAvatar'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Textarea } from '#/components/ui/textarea'
import { useAuth } from '#/context/auth/auth-hook'
import {
  useProjectCommentActions,
  useGetProjectActivity,
} from '#/hooks/project.hooks'
import { useWorkspacePermissions } from '#/hooks/use-workspace-permissions'
import { formatDateTime, cn } from '#/lib/utils'
import type { ProjectDetail } from '#/type/project'
import type {
  ProjectActivityEntry,
  ProjectCommentActivity,
  ProjectEventActivity,
} from '#/type/projectActivity'
import {
  Box,
  CalendarDays,
  CircleDot,
  Ellipsis,
  Flag,
  Pencil,
  RefreshCw,
  Sparkles,
  Trash2,
  UsersRound,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

function getProjectActivityIcon(type: ProjectEventActivity['type']) {
  const className = 'size-3.5'

  switch (type) {
    case 'project_created':
      return <Box className={className} />
    case 'lead_changed':
      return <UserRound className={className} />
    case 'member_added':
    case 'member_removed':
      return <UsersRound className={className} />
    case 'priority_changed':
      return <Flag className={className} />
    case 'status_changed':
      return <CircleDot className={className} />
    case 'start_date_changed':
    case 'end_date_changed':
      return <CalendarDays className={className} />
    case 'milestone_added':
    case 'milestone_removed':
    case 'milestone_changed':
      return <Sparkles className={className} />
    default:
      return <RefreshCw className={className} />
  }
}

function ProjectCommentRow({
  comment,
  compact,
  isAuthor,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  comment: ProjectCommentActivity
  compact: boolean
  isAuthor: boolean
  canEdit: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article className="group flex min-w-0 items-start gap-3">
      <ProjectPersonAvatar
        name={comment.username}
        className="mt-0.5 size-8 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="wrap-anywhere text-sm font-medium">
            {comment.username}
          </span>
          <time className="text-xs text-muted-foreground">
            {formatDateTime(comment.createdAt)}
          </time>
        </div>
        <p
          className={cn(
            'whitespace-pre-wrap text-sm leading-6 text-muted-foreground wrap-anywhere',
            compact && 'line-clamp-3',
          )}
        >
          {comment.content}
        </p>
      </div>
      {!compact && isAuthor && (canEdit || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Comment actions"
              className="size-7 shrink-0 text-muted-foreground transition-opacity lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil />
                Edit
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </article>
  )
}

export default function ProjectActivity({
  project,
  compact = false,
  onSeeAll,
  scrollRootRef,
}: {
  project: ProjectDetail
  compact?: boolean
  onSeeAll?: () => void
  scrollRootRef?: RefObject<HTMLDivElement | null>
}) {
  const headingId = useId()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const requestingRef = useRef(false)
  const [selectedComment, setSelectedComment] =
    useState<ProjectCommentActivity | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const { user } = useAuth()
  const { can } = useWorkspacePermissions()
  const {
    data,
    isError,
    isPending,
    isFetching,
    isFetchNextPageError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetProjectActivity(project.id)
  const comments = useProjectCommentActions(project.id)
  const entries = data?.pages.flatMap((page) => page.projectActivities) ?? []

  const loadNextPage = useCallback(async () => {
    if (
      !hasNextPage ||
      isFetching ||
      isFetchNextPageError ||
      requestingRef.current
    ) {
      return
    }

    requestingRef.current = true
    try {
      await fetchNextPage()
    } finally {
      requestingRef.current = false
    }
  }, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetching])

  useEffect(() => {
    if (compact) return
    const root = scrollRootRef?.current
    const sentinel = loadMoreRef.current
    if (!root || !sentinel) return

    function handleScroll() {
      if (
        root &&
        root.clientHeight + root.scrollTop + 100 >= root.scrollHeight
      ) {
        void loadNextPage()
      }
    }

    root.addEventListener('scroll', handleScroll)
    handleScroll()
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadNextPage()
      },
      { root, rootMargin: '100px' },
    )
    observer.observe(sentinel)

    return () => {
      root.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [compact, entries.length, loadNextPage, scrollRootRef])

  function updateSelectedComment(content: string) {
    if (!selectedComment) return
    comments.update.mutate(
      { commentId: selectedComment.id, content },
      {
        onSuccess: () => {
          setUpdateDialogOpen(false)
          setSelectedComment(null)
          toast.success('Comment updated')
        },
        onError: () =>
          toast.error('Unable to update comment. Please try again.'),
      },
    )
  }

  function deleteSelectedComment() {
    if (!selectedComment) return
    comments.remove.mutate(selectedComment.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setSelectedComment(null)
        toast.success('Comment deleted')
      },
      onError: () => toast.error('Unable to delete comment. Please try again.'),
    })
  }

  const visibleEntries = compact ? entries.slice(0, 2) : entries

  return (
    <section
      aria-labelledby={headingId}
      className={cn(compact && 'rounded-xl border bg-muted/20 p-4')}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-sm font-medium">
          Activity
        </h2>
        {onSeeAll && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={onSeeAll}
          >
            See all
          </Button>
        )}
      </div>

      {isPending ? (
        <ActivityEventSkeleton />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          Could not load project activity.
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <div className="space-y-5">
          {visibleEntries.map((entry: ProjectActivityEntry) =>
            entry.activityType === 'comment' ? (
              <ProjectCommentRow
                key={`comment-${entry.id}`}
                comment={entry}
                compact={compact}
                isAuthor={entry.userId === user?.id}
                canEdit={can('comment:update')}
                canDelete={can('project:comment:delete')}
                onEdit={() => {
                  setSelectedComment(entry)
                  setUpdateDialogOpen(true)
                }}
                onDelete={() => {
                  setSelectedComment(entry)
                  setDeleteDialogOpen(true)
                }}
              />
            ) : (
              <ActivityEventRow
                key={`activity-${entry.id}`}
                icon={getProjectActivityIcon(entry.type)}
                description={entry.description}
                createdAt={entry.createdAt}
              />
            ),
          )}
          {!compact && hasNextPage && (
            <div ref={loadMoreRef} className="py-2">
              {isFetchingNextPage && <ActivityEventSkeleton />}
              {isFetchNextPageError && (
                <Button variant="ghost" size="sm" onClick={loadNextPage}>
                  Retry loading activity
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <DeleteCommentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={deleteSelectedComment}
        isDeleting={comments.remove.isPending}
      />
      <UpdateCommentDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        isUpdating={comments.update.isPending}
        onUpdate={updateSelectedComment}
        comment={selectedComment ?? { content: '' }}
      />
    </section>
  )
}

export function ProjectCommentComposer({ projectId }: { projectId: string }) {
  const [content, setContent] = useState('')
  const { can } = useWorkspacePermissions()
  const createComment = useProjectCommentActions(projectId).create

  if (!can('comment:create')) return null

  function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedContent = content.trim()
    if (!trimmedContent) return

    createComment.mutate(trimmedContent, {
      onSuccess: () => {
        setContent('')
        toast.success('Comment added')
      },
      onError: () => toast.error('Unable to add comment. Please try again.'),
    })
  }

  return (
    <form
      onSubmit={submitComment}
      className="shrink-0 border-t bg-background px-4 py-3 sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Leave a comment..."
          aria-label="Write a project comment"
          rows={2}
          className="max-h-32 min-w-0 flex-1 resize-none"
          disabled={createComment.isPending}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || createComment.isPending}
        >
          {createComment.isPending ? 'Commenting...' : 'Add comment'}
        </Button>
      </div>
    </form>
  )
}
