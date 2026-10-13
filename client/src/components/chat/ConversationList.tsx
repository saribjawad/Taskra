import { useCallback, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { LoaderCircle, MessageSquareText, Plus, Search } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ParticipantAvatars, conversationName } from './chat-utils'
import { cn } from '#/lib/utils'
import type { Conversation } from '#/type/conversation'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  activeUserIds: string[]
  search: string
  isPending: boolean
  isError: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onSearchChange: (search: string) => void
  onSelect: (conversationId: string) => void
  onNewConversation: () => void
  onRetry: () => void
  onLoadMore: () => void
}

function ConversationRow({
  conversation,
  isSelected,
  activeUserIds,
  onSelect,
}: {
  conversation: Conversation
  isSelected: boolean
  activeUserIds: string[]
  onSelect: () => void
}) {
  const time = conversation.lastMessage?.created_at ?? conversation.createdAt

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isSelected ? 'true' : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring',
        isSelected && 'bg-muted',
      )}
    >
      <ParticipantAvatars
        participants={conversation.participants}
        activeUserIds={activeUserIds}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">
            {conversationName(conversation.participants)}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(time), { addSuffix: false })}
          </span>
        </span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {conversation.lastMessage?.content ?? 'Start a conversation'}
        </span>
      </span>
    </button>
  )
}

export function ConversationList({
  conversations,
  selectedId,
  activeUserIds,
  search,
  isPending,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onSearchChange,
  onSelect,
  onNewConversation,
  onRetry,
  onLoadMore,
}: ConversationListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const visibleConversations = conversations.filter((conversation) =>
    conversationName(conversation.participants)
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )

  const loadMoreIfNeeded = useCallback(() => {
    const element = listRef.current
    if (
      element &&
      element.scrollHeight - element.scrollTop - element.clientHeight < 80 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      onLoadMore()
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore])

  useEffect(() => {
    loadMoreIfNeeded()
  }, [conversations.length, loadMoreIfNeeded])

  return (
    <aside
      aria-label="Conversations"
      className={cn(
        'min-h-0 w-full shrink-0 flex-col md:flex md:w-80 md:border-r lg:w-88',
        selectedId ? 'hidden' : 'flex',
        'md:flex',
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Messages</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Workspace conversations
          </p>
        </div>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="New message"
          title="New message"
          onClick={onNewConversation}
        >
          <Plus />
        </Button>
      </div>

      <div className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Find a conversation"
            className="h-9 pl-9"
            aria-label="Find a conversation"
          />
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={loadMoreIfNeeded}
        className="min-h-0 flex-1 overflow-y-auto p-2"
      >
        {isPending ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
          </div>
        ) : isError ? (
          <div className="p-4 text-sm text-muted-foreground">
            Could not load conversations.{' '}
            <button className="underline" onClick={onRetry}>
              Try again
            </button>
          </div>
        ) : visibleConversations.length ? (
          <div className="space-y-1">
            {visibleConversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedId === conversation.id}
                activeUserIds={activeUserIds}
                onSelect={() => onSelect(conversation.id)}
              />
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <MessageSquareText className="size-5" />
            </div>
            <p className="text-sm font-medium">
              {search ? 'No matches' : 'No conversations yet'}
            </p>
            <p className="mt-1 max-w-52 text-xs leading-5 text-muted-foreground">
              {search
                ? 'Try another name.'
                : 'Start a conversation with someone in your workspace.'}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={onNewConversation}
              >
                <Plus /> New message
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
