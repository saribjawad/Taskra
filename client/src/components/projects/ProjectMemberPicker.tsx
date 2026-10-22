import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { Check, Search, Users } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import ProjectPersonAvatar from './ProjectPersonAvatar'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Spinner } from '#/components/ui/spinner'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'
import { useChangeProjectMembers } from '#/hooks/project.hooks'
import type { ProjectDetail } from '#/type/project'

export default function ProjectMemberPicker({
  project,
  disabled = false,
}: {
  project: ProjectDetail
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const changing = useRef(false)
  const [selection, setSelection] = useState<Record<string, boolean>>({})

  const {
    data: users,
    isPending: loading,
    isError,
    refetch,
  } = useGetWorkspaceUsers(project.workspace_id)
  const { mutateAsync, isPending } = useChangeProjectMembers(
    project.workspace_id,
    project.id,
  )

  // Keep existing members removable even if they no longer appear in workspace users.
  const options = (users ?? []).map((user) => ({
    key: user.id,
    userId: user.id,
    name: user.username,
    email: user.email,
    membershipId: project.members.find((member) => member.user?.id === user.id)
      ?.id,
  }))
  for (const member of project.members) {
    if (!options.some((option) => option.membershipId === member.id)) {
      options.push({
        key: member.id,
        userId: member.user?.id ?? '',
        name: member.user?.username || 'Unknown member',
        email: member.user?.email || '',
        membershipId: member.id,
      })
    }
  }
  const query = search.trim().toLowerCase()
  const visible = options.filter((option) =>
    `${option.name} ${option.email}`.toLowerCase().includes(query),
  )

  // Only send changes that still differ from the latest saved memberships.
  const addedUserIds = options
    .filter((option) => selection[option.key] === true && !option.membershipId)
    .map((option) => option.userId)
  const removedMembershipIds = options
    .filter((option) => selection[option.key] === false && option.membershipId)
    .map((option) => option.membershipId!)
  const hasChanges = addedUserIds.length > 0 || removedMembershipIds.length > 0

  async function saveMembers() {
    if (changing.current || !hasChanges) return
    changing.current = true
    setError(null)
    try {
      await mutateAsync({ addedUserIds, removedMembershipIds })
      setOpen(false)
      setSelection({})
      setSearch('')
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message
        : err instanceof Error
          ? err.message
          : undefined
      setError(
        typeof message === 'string'
          ? message
          : 'Unable to update members. Please try again.',
      )
    } finally {
      changing.current = false
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (changing.current) return
        setSelection({})
        setOpen(next)
        if (!next) {
          setSearch('')
          setError(null)
        }
      }}
    >
      {/* Compact member count opens the multi-select picker. */}
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="-ml-2 h-auto max-w-full justify-start gap-2 px-2 py-0.5 text-xs font-normal"
          aria-label="Change project members"
        >
          {project.members.length ? (
            <span className="flex -space-x-2" aria-hidden="true">
              {project.members.slice(0, 4).map((member) => (
                <ProjectPersonAvatar
                  key={member.id}
                  name={member.user?.username}
                  className="size-5 ring-2 ring-background"
                />
              ))}
            </span>
          ) : (
            <Users className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {project.members.length === 0
            ? 'Add members'
            : `${project.members.length} ${project.members.length === 1 ? 'member' : 'members'}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0"
        aria-label="Project members"
      >
        {/* Search workspace members by name or email. */}
        <div className="relative border-b">
          <Search className="pointer-events-none absolute left-3 top-2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Change members…"
            aria-label="Search members"
            className="h-8 rounded-none border-0 bg-transparent pl-9 text-xs shadow-none focus-visible:ring-inset placeholder:text-xs"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1.5" aria-busy={isPending}>
          {loading ? (
            <p
              role="status"
              className="flex items-center gap-2 p-3 text-xs text-muted-foreground"
            >
              <Spinner />
              Loading members…
            </p>
          ) : isError ? (
            <div role="alert" className="p-3 text-xs">
              <p>Unable to load members.</p>
              <Button variant="link" size="sm" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">
              {query ? 'No members found.' : 'No workspace members available.'}
            </p>
          ) : (
            <div
              role="group"
              aria-label="Select project members"
              className="space-y-0.5"
            >
              {visible.map((option) => {
                const selected =
                  selection[option.key] ?? Boolean(option.membershipId)
                return (
                  <Button
                    key={option.key}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    aria-label={`${option.name}${option.email ? ` (${option.email})` : ''}`}
                    disabled={isPending}
                    variant="ghost"
                    className="h-auto w-full justify-start gap-2.5 px-2 py-2 font-normal"
                    onClick={() =>
                      setSelection((previous) => ({
                        ...previous,
                        [option.key]: !selected,
                      }))
                    }
                  >
                    <ProjectPersonAvatar name={option.name} />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-xs">
                        {option.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {option.email}
                      </span>
                    </span>
                    {selected ? (
                      <Check className="size-3.5 shrink-0" />
                    ) : (
                      <span className="size-3.5 shrink-0" />
                    )}
                  </Button>
                )
              })}
            </div>
          )}
        </div>
        {error && (
          <p
            role="alert"
            className="border-t px-3 py-2 text-xs text-destructive"
          >
            {error}
          </p>
        )}
        {/* Selections stay local until Save is pressed. */}
        <div className="flex items-center justify-end gap-2 border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setOpen(false)
              setSelection({})
              setSearch('')
              setError(null)
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!hasChanges || isPending || loading || isError}
            onClick={() => void saveMembers()}
          >
            {isPending && <Spinner className="size-3.5" />}Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
