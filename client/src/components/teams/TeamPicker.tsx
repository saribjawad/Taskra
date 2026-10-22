import { useState } from 'react'
import { Check, ChevronDown, Users } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import type { Team } from '#/type/team'

export function TeamPicker({
  teams,
  value,
  onChange,
  disabled,
}: {
  teams: Team[]
  value: string
  onChange: (teamId: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selectedTeam = teams.find((team) => team.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || teams.length === 0}
          aria-label="Choose team"
          className="h-7 gap-1.5 rounded-full bg-muted/70 px-2 text-xs font-normal hover:bg-muted"
        >
          <Users className="size-3.5 text-purple-400" />
          <span>
            {selectedTeam?.identifier ?? selectedTeam?.name ?? 'Team'}
          </span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 gap-1 p-1.5">
        {teams.map((team) => {
          const selected = team.id === value

          return (
            <Button
              key={team.id}
              type="button"
              variant="ghost"
              aria-pressed={selected}
              className="h-8 w-full justify-start gap-2 px-2 text-xs font-normal"
              onClick={() => {
                onChange(team.id)
                setOpen(false)
              }}
            >
              <Users className="size-3.5 shrink-0 text-purple-400" />
              <span className="min-w-0 flex-1 truncate text-left">
                {team.name}
              </span>
              <span className="text-muted-foreground">{team.identifier}</span>
              {selected && <Check className="size-3.5 shrink-0" />}
            </Button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
