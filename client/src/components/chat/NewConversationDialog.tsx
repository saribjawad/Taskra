import { useMemo, useState } from 'react'
import { LoaderCircle, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { useAuth } from '#/context/auth/auth-hook'
import { useWebsocketContextHook } from '#/context/websocket/websocket-hook'
import { useCreateConversation } from '#/hooks/conversation.hooks'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'
import { getInitials } from '#/lib/utils'
import type { Conversation, ConversationPerson } from '#/type/conversation'

interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  conversations: Conversation[]
  onCreated: (conversationId: string, person: ConversationPerson) => void
}

export function NewConversationDialog({
  open,
  onOpenChange,
  workspaceId,
  conversations,
  onCreated,
}: NewConversationDialogProps) {
  const { user } = useAuth()
  const { activeUserIds } = useWebsocketContextHook()
  const {
    data: users,
    isPending,
    isError,
    refetch,
  } = useGetWorkspaceUsers(workspaceId, open)
  const { mutateAsync: createConversation, isPending: isCreating } =
    useCreateConversation()
  const [search, setSearch] = useState('')

  const people = useMemo(
    () =>
      (users ?? [])
        .filter((person) => person.id !== user?.id)
        .filter((person) => {
          const query = search.trim().toLowerCase()
          return (
            !query ||
            `${person.username} ${person.email}`
              .toLowerCase()
              .includes(query)
          )
        }),
    [users, user?.id, search],
  )

  async function startConversation(person: ConversationPerson) {
    // Open the existing direct conversation instead of creating a duplicate.
    const existing = conversations.find(
      (conversation) =>
        conversation.participants.length === 1 &&
        conversation.participants[0]?.id === person.id,
    )

    if (existing) {
      onCreated(existing.id, person)
      onOpenChange(false)
      return
    }

    try {
      const conversationId = await createConversation(person.id)
      onCreated(conversationId, person)
      toast.success('Conversation ready')
      onOpenChange(false)
      setSearch('')
    } catch {
      toast.error('Could not start a conversation')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Choose someone in your workspace to message.
          </DialogDescription>
        </DialogHeader>
        <div className="border-b p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people"
              className="pl-9"
              aria-label="Search workspace members"
            />
          </div>
        </div>
        <div className="max-h-[min(55vh,420px)] min-h-32 overflow-y-auto p-2">
          {isPending ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
            </div>
          ) : isError ? (
            <div className="p-4 text-sm text-muted-foreground">
              Could not load workspace members.{' '}
              <button className="underline" onClick={() => void refetch()}>
                Try again
              </button>
            </div>
          ) : people.length ? (
            people.map((person) => (
              <button
                key={person.id}
                type="button"
                disabled={isCreating}
                onClick={() => void startConversation(person)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
              >
                <Avatar size="sm" className="relative">
                  <AvatarFallback>{getInitials(person.username)}</AvatarFallback>
                  {activeUserIds.includes(person.id) && (
                    <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                  )}
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {person.username}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {person.email}
                  </span>
                </span>
                {isCreating && <LoaderCircle className="size-4 animate-spin" />}
              </button>
            ))
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No people match that search.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
