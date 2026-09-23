import { useState } from 'react'
import { Check, Search, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Spinner } from '#/components/ui/spinner'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'
import type { ProjectDetail } from '#/type/project'

export default function ProjectLeadPicker({
  project,
  disabled,
  onSelect,
}: {
  project: ProjectDetail
  disabled: boolean
  onSelect: (userId: string) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const {
    data: users,
    isPending,
    isError,
    refetch,
  } = useGetWorkspaceUsers(project.workspace_id)
  const query = search.trim().toLowerCase()
  const visibleUsers = users?.filter((user) =>
    `${user.username} ${user.email}`.toLowerCase().includes(query),
  )

  async function selectLead(userId: string) {
    if (saving || userId === project.lead?.id) return
    setSaving(true)
    try {
      if (await onSelect(userId)) setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (saving) return
        setOpen(next)
        if (!next) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label="Change project lead"
          className="-ml-2 h-auto max-w-full justify-start gap-2 px-2 py-0.5 text-xs font-normal"
        >
          <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
          {project.lead?.username || 'Add lead'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0"
        aria-label="Project lead"
      >
        <div className="relative border-b">
          <Search className="pointer-events-none absolute left-3 top-2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Change lead…"
            aria-label="Search workspace members"
            className="h-8 rounded-none border-0 bg-transparent pl-9 text-xs shadow-none focus-visible:ring-inset placeholder:text-xs"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1.5" aria-busy={saving}>
          {isPending ? (
            <p
              role="status"
              className="flex items-center gap-2 p-3 text-xs text-muted-foreground"
            >
              <Spinner /> Loading members…
            </p>
          ) : isError ? (
            <div role="alert" className="p-3 text-xs">
              <p>Unable to load members.</p>
              <Button variant="link" size="sm" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : !visibleUsers?.length ? (
            <p className="p-3 text-xs text-muted-foreground">
              {query ? 'No members found.' : 'No workspace members available.'}
            </p>
          ) : (
            <div
              role="group"
              aria-label="Choose project lead"
              className="space-y-0.5"
            >
              {visibleUsers.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant="ghost"
                  disabled={saving}
                  aria-pressed={project.lead?.id === user.id}
                  className="h-auto w-full justify-start gap-2.5 px-2 py-2 font-normal"
                  onClick={() => void selectLead(user.id)}
                >
                  <Avatar className="size-6">
                    <AvatarFallback className="text-xs">
                      {user.username.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-xs">
                      {user.username}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </span>
                  </span>
                  {project.lead?.id === user.id && (
                    <Check className="size-3.5 shrink-0" />
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
