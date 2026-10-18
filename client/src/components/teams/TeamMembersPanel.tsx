import { useMemo, useState } from 'react'
import { Check, Search, Trash2, Users } from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
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
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import {
  useAddTeamMembers,
  useGetTeamMembers,
  useRemoveTeamMember,
} from '#/hooks/team.hooks'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'
import { getInitials } from '#/lib/utils'
import type { Team } from '#/type/team'

function AddMembersDialog({
  team,
  workspaceId,
  currentMemberIds,
}: {
  team: Team
  workspaceId: string
  currentMemberIds: Set<string>
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const {
    data: workspaceUsers = [],
    isPending,
    isError,
    refetch,
  } = useGetWorkspaceUsers(workspaceId, open)
  const { mutateAsync, isPending: isAdding } = useAddTeamMembers(team.id)

  const availableUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return workspaceUsers.filter((person) => {
      const available = !currentMemberIds.has(person.id)
      const matches = `${person.username} ${person.email}`
        .toLowerCase()
        .includes(query)
      return available && matches
    })
  }, [workspaceUsers, currentMemberIds, search])

  async function addSelectedMembers() {
    if (!selected.length || isAdding) return
    try {
      await mutateAsync(selected)
      setOpen(false)
      setSelected([])
      setSearch('')
    } catch {
      // The mutation shows the request error.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setSelected([])
          setSearch('')
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Users /> Add members
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Add members to {team.name}</DialogTitle>
          <DialogDescription>
            Choose people who already belong to this workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="border-b p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search workspace members"
              className="pl-9"
              aria-label="Search workspace members"
            />
          </div>
        </div>
        <div className="max-h-[min(55vh,420px)] min-h-32 overflow-y-auto p-2">
          {isPending ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div role="alert" className="p-4 text-sm text-muted-foreground">
              Could not load workspace members.{' '}
              <button className="underline" onClick={() => void refetch()}>
                Try again
              </button>
            </div>
          ) : availableUsers.length ? (
            availableUsers.map((person) => {
              const isSelected = selected.includes(person.id)
              return (
                <button
                  key={person.id}
                  type="button"
                  disabled={isAdding}
                  aria-pressed={isSelected}
                  onClick={() =>
                    setSelected((current) =>
                      isSelected
                        ? current.filter((id) => id !== person.id)
                        : [...current, person.id],
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(person.username)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {person.username}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {person.email}
                    </span>
                  </span>
                  {isSelected && <Check className="size-4 text-primary" />}
                </button>
              )
            })
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {search
                ? 'No workspace members match that search.'
                : 'Everyone in this workspace is already on the team.'}
            </p>
          )}
        </div>
        <DialogFooter className="border-t px-4 py-3 sm:justify-between">
          <span className="mr-auto text-xs text-muted-foreground">
            {selected.length} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={isAdding}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selected.length || isAdding}
            onClick={() => void addSelectedMembers()}
          >
            {isAdding ? 'Adding…' : 'Add members'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TeamMembersPanel({
  team,
  workspaceId,
}: {
  team: Team
  workspaceId: string
}) {
  const [search, setSearch] = useState('')
  const {
    data: members = [],
    isPending,
    isError,
    refetch,
  } = useGetTeamMembers(team.id)
  const {
    mutate: removeMember,
    isPending: isRemoving,
    variables: removingMemberId,
  } = useRemoveTeamMember(team.id)
  const memberIds = useMemo(
    () => new Set(members.map((member) => member.id)),
    [members],
  )
  const query = search.trim().toLowerCase()
  const visibleMembers = members.filter((member) =>
    `${member.fullName || member.username} ${member.email}`
      .toLowerCase()
      .includes(query),
  )

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? 'person has' : 'people have'}{' '}
            access to {team.name}.
          </p>
        </div>
        <AddMembersDialog
          team={team}
          workspaceId={workspaceId}
          currentMemberIds={memberIds}
        />
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search team members"
          className="h-9 pl-8"
          aria-label="Search team members"
        />
      </div>

      <div className="mt-4 divide-y divide-border/60 border-y border-border/60">
        {isPending ? (
          Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 py-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          ))
        ) : isError ? (
          <div role="alert" className="py-10 text-center text-sm">
            <p className="text-muted-foreground">Unable to load team members.</p>
            <Button variant="link" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : visibleMembers.length ? (
          visibleMembers.map((member) => (
            <div
              key={member.teamMemberId}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {getInitials(member.fullName || member.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.fullName || member.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isRemoving}
                onClick={() => removeMember(member.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
                Remove from team
              </Button>
              {isRemoving && removingMemberId === member.id && (
                <span className="sr-only">Removing {member.username}</span>
              )}
            </div>
          ))
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {search ? 'No members match that search.' : 'No team members yet.'}
          </p>
        )}
      </div>
    </section>
  )
}
