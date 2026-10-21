import { useState } from 'react'
import { Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Spinner } from '#/components/ui/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { useDeleteTeam } from '#/hooks/team.hooks'
import type { Team } from '#/type/team'

export function DeleteTeamDialog({
  team,
  workspaceId,
  isLastTeam,
  onDeleted,
}: {
  team: Team
  workspaceId: string
  isLastTeam: boolean
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const { mutateAsync, isPending } = useDeleteTeam(workspaceId)

  async function deleteCurrentTeam() {
    if (isPending || isLastTeam) return

    try {
      await mutateAsync(team.id)
      setOpen(false)
      onDeleted()
    } catch {
      // The mutation displays the request error.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isLastTeam ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex shrink-0">
              <Button
                variant="ghost"
                size="sm"
                disabled
                aria-label="Delete team"
              >
                <Trash2 />
                Delete team
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            The last team in a workspace can’t be deleted.
          </TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive">
            <Trash2 />
            Delete team
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <TriangleAlert className="size-6 text-destructive" />
          </div>
          <DialogTitle>Delete {team.name}?</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              This permanently deletes the team and removes its members.
            </span>
            <span className="block">
              Deleting this team will also delete its tasks and projects. Remove
              the team’s documents and links first.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => void deleteCurrentTeam()}
          >
            {isPending && <Spinner />}
            Delete team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
