import { useMemo, useState } from 'react'
import { Check, LoaderCircle, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
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
import type { CreateConversationInput } from '#/service/conversation.service'
import type { Conversation, ConversationPerson } from '#/type/conversation'

interface CreatedConversation {
  id: string
  participants: ConversationPerson[]
  isGroup: boolean
  title: string | null
}

interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  conversations: Conversation[]
  onCreated: (conversation: CreatedConversation) => void
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
  const [isGroup, setIsGroup] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<ConversationPerson[]>([])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSearch('')
      setTitle('')
      setSelectedPeople([])
      setIsGroup(false)
    }
    onOpenChange(nextOpen)
  }

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
    if (isGroup) {
      setSelectedPeople((current) =>
        current.some((selected) => selected.id === person.id)
          ? current.filter((selected) => selected.id !== person.id)
          : [...current, person],
      )
      return
    }

    // Open the existing direct conversation instead of creating a duplicate.
    const existing = conversations.find(
      (conversation) =>
        conversation.participants.length === 1 &&
        conversation.participants[0]?.id === person.id,
    )

    if (existing) {
      onCreated({
        id: existing.id,
        participants: [person],
        isGroup: false,
        title: null,
      })
      handleOpenChange(false)
      return
    }

    try {
      const input: CreateConversationInput = { participants: [person.id] }
      const conversationId = await createConversation(input)
      onCreated({
        id: conversationId,
        participants: [person],
        isGroup: false,
        title: null,
      })
      toast.success('Conversation ready')
      handleOpenChange(false)
      setSearch('')
    } catch {
      toast.error('Could not start a conversation')
    }
  }

  async function createGroup() {
    const cleanTitle = title.trim()
    if (!cleanTitle || !selectedPeople.length || isCreating) return

    try {
      const input: CreateConversationInput = {
        participants: selectedPeople.map((person) => person.id),
        isGroup: true,
        title: cleanTitle,
      }
      const id = await createConversation(input)
      onCreated({ id, participants: selectedPeople, isGroup: true, title: cleanTitle })
      toast.success('Group conversation created')
      handleOpenChange(false)
      setSearch('')
      setTitle('')
      setSelectedPeople([])
      setIsGroup(false)
    } catch {
      toast.error('Could not create a group conversation')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{isGroup ? 'New group conversation' : 'New message'}</DialogTitle>
          <DialogDescription>
            {isGroup
              ? 'Choose people and give the group a name.'
              : 'Choose someone in your workspace to message.'}
          </DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-3 right-12"
            onClick={() => {
              setIsGroup((current) => !current)
              setSelectedPeople([])
            }}
          >
            {isGroup ? 'Direct message' : <><Users /> New group</>}
          </Button>
        </DialogHeader>
        {isGroup && (
          <div className="border-b px-3 py-2">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Group name"
              maxLength={25}
              aria-label="Group name"
            />
          </div>
        )}
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
                {isGroup && selectedPeople.some((selected) => selected.id === person.id) && (
                  <Check className="size-4 text-primary" />
                )}
              </button>
            ))
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No people match that search.
            </p>
          )}
        </div>
        {isGroup && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {selectedPeople.length} selected
            </span>
            <Button
              size="sm"
              disabled={!title.trim() || !selectedPeople.length || isCreating}
              onClick={() => void createGroup()}
            >
              {isCreating && <LoaderCircle className="animate-spin" />}
              Create group
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
