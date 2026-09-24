import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Diamond,
  Ellipsis,
  Plus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import DateField from '#/components/fields/DateField'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { useProjectMilestoneActions } from '#/hooks/project.hooks'
import type { ProjectDetail, ProjectMilestone } from '#/type/project'
import { cn } from '#/lib/utils'
import { formatProjectDate } from './project-presentation'

function dateInputValue(value: string | null) {
  return value?.slice(0, 10) ?? ''
}

export default function ProjectMilestones({
  project,
  compact = false,
}: {
  project: ProjectDetail
  compact?: boolean
}) {
  const headingId = useId()
  const [editing, setEditing] = useState<ProjectMilestone | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectMilestone | null>(
    null,
  )

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const actions = useProjectMilestoneActions(project.workspace_id, project.id)
  const busy =
    actions.create.isPending ||
    actions.update.isPending ||
    actions.remove.isPending

  function startEditing(milestone: ProjectMilestone | 'new') {
    setEditing(milestone)
    setName(milestone === 'new' ? '' : milestone.name)
    setDescription(milestone === 'new' ? '' : (milestone.description ?? ''))
    setTargetDate(
      milestone === 'new' ? '' : dateInputValue(milestone.target_date),
    )
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editing || !name.trim()) return

    try {
      if (editing === 'new') {
        await actions.create.mutateAsync({
          name: name.trim(),
          ...(description.trim() && { description: description.trim() }),
          ...(targetDate && { targetDate }),
        })
        toast.success('Milestone created')
      } else {
        // The API accepts partial updates. Send only values that changed.
        const changes = {
          ...(name.trim() !== editing.name && { name: name.trim() }),
          ...(description.trim() !== (editing.description ?? '') && {
            description: description.trim() || null,
          }),
          ...(targetDate !== dateInputValue(editing.target_date) && {
            targetDate: targetDate || null,
          }),
        }
        if (Object.keys(changes).length) {
          await actions.update.mutateAsync({
            milestoneId: editing.id,
            payload: changes,
          })
          toast.success('Milestone updated')
        }
      }
      setEditing(null)
    } catch {
      toast.error('Unable to save milestone. Please try again.')
    }
  }

  async function remove() {
    if (!deleteTarget) return
    try {
      await actions.remove.mutateAsync(deleteTarget.id)
      if (editing !== 'new' && editing?.id === deleteTarget.id) setEditing(null)
      setDeleteTarget(null)
      toast.success('Milestone deleted')
    } catch {
      toast.error('Unable to delete milestone. Please try again.')
    }
  }

  const form = (
    <form
      onSubmit={(event) => void save(event)}
      className="space-y-3 rounded-lg border bg-muted/20 p-3"
    >
      <div className="flex items-center gap-2">
        <Diamond className="size-3.5 shrink-0 text-muted-foreground" />
        <Input
          autoFocus
          required
          maxLength={80}
          aria-label="Milestone name"
          placeholder="Milestone name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={busy}
          className="h-8 min-w-0 flex-1 border-0 bg-transparent! px-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>
      <Textarea
        aria-label="Milestone description"
        placeholder="Add a description…"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        disabled={busy}
        rows={2}
        className="min-h-10 resize-y border-0 bg-transparent! px-2 py-1 text-sm shadow-none"
      />
      {/* Reuse the same calendar picker as the project and task dialogs. */}
      <div className="flex justify-end gap-1">
        <DateField
          iconOnly
          value={targetDate ? parseISO(targetDate) : undefined}
          onChange={(date) =>
            setTargetDate(date ? format(date, 'yyyy-MM-dd') : '')
          }
          placeholder="Target date"
          disabled={busy}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Cancel milestone"
          title="Cancel"
          disabled={busy}
          onClick={() => setEditing(null)}
        >
          <X className="size-4" />
        </Button>
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label="Save milestone"
          title="Save milestone"
          disabled={busy || !name.trim()}
        >
          <Check className="size-4" />
        </Button>
      </div>
    </form>
  )

  return (
    <section
      aria-labelledby={headingId}
      className={cn(compact && 'rounded-xl border bg-muted/20 p-4')}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-sm font-medium">
          Milestones
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Add milestone"
          title="Add milestone"
          disabled={busy || editing !== null}
          onClick={() => startEditing('new')}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <ul className="space-y-1">
        {project.milestones.map((milestone) => (
          <li key={milestone.id}>
            {editing !== 'new' && editing?.id === milestone.id ? (
              form
            ) : (
              <div className="group rounded-lg hover:bg-muted/50 px-2">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    aria-expanded={expandedId === milestone.id}
                    onClick={() =>
                      setExpandedId(
                        expandedId === milestone.id ? null : milestone.id,
                      )
                    }
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-2 rounded-lg py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      compact ? 'text-xs' : 'text-sm',
                    )}
                  >
                    <Diamond className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      {milestone.name}
                    </span>
                    {milestone.target_date && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatProjectDate(milestone.target_date)}
                      </span>
                    )}
                    {expandedId === milestone.id ? (
                      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-7 shrink-0"
                        aria-label={`Options for ${milestone.name}`}
                      >
                        <Ellipsis className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        onSelect={() => startEditing(milestone)}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleteTarget(milestone)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {expandedId === milestone.id && (
                  <p className="px-5 pb-3 text-xs leading-5 whitespace-pre-wrap text-muted-foreground">
                    {milestone.description || 'No description yet.'}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
        {editing === 'new' && <li>{form}</li>}
      </ul>
      {!project.milestones.length && editing !== 'new' && (
        <p className="py-3 text-xs text-muted-foreground">No milestones yet.</p>
      )}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete milestone?</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.name}” will be removed from this project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              Delete milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
