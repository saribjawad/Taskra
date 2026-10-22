import { useState } from 'react'
import { Check, ChevronDown, Users } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { useGetTeams } from '#/hooks/team.hooks'
import { useWorkspacePermissions } from '#/hooks/use-workspace-permissions'
import { TeamOverviewLink } from './TeamOverviewLink'

export function TeamProperty({
  team,
  workspaceId,
  disabled,
  onChange,
}: {
  team: { id: string; name: string }
  workspaceId: string
  disabled?: boolean
  onChange: (teamId: string) => Promise<boolean>
}) {
  const { can } = useWorkspacePermissions()
  const canChangeTeam = can('team:update')
  const { data: teams = [], isPending } = useGetTeams(
    workspaceId,
    canChangeTeam,
  )
  const [open, setOpen] = useState(false)

  async function selectTeam(teamId: string) {
    if (teamId === team.id) {
      setOpen(false)
      return
    }

    try {
      if (await onChange(teamId)) setOpen(false)
    } catch {}
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      <TeamOverviewLink team={team} workspaceId={workspaceId} />
      {canChangeTeam && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Change team"
              disabled={disabled || isPending}
              className="size-6 shrink-0 text-muted-foreground"
            >
              <ChevronDown className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-60 gap-1 p-1.5">
            <p className="px-2 py-1 text-xs text-muted-foreground">
              Move to team
            </p>
            {teams.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant="ghost"
                className="h-8 w-full justify-start gap-2 px-2 text-xs font-normal"
                disabled={disabled}
                onClick={() => void selectTeam(option.id)}
              >
                <Users className="size-3.5 shrink-0 text-purple-500" />
                <span className="min-w-0 flex-1 truncate text-left">
                  {option.name}
                </span>
                {team.id === option.id && (
                  <Check className="size-3.5 shrink-0" />
                )}
              </Button>
            ))}
            {!isPending && teams.length === 0 && (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No teams available
              </p>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
