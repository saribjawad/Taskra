import { useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  LoaderCircle,
  MessageSquareText,
  Send,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { ParticipantAvatars, conversationName } from './chat-utils'
import { cn, getInitials } from '#/lib/utils'
import type { ChatMessage, Conversation } from '#/type/conversation'

interface ConversationThreadProps {
  conversation: Conversation
  activeUserIds: string[]
  isConnected: boolean
  currentUserId?: string
  currentUserName?: string
  messages: ChatMessage[]
  isPending: boolean
  isError: boolean
  isFetchingOlder: boolean
  hasOlderMessages: boolean
  draft: string
  isSending: boolean
  onDraftChange: (draft: string) => void
  onBack: () => void
  onRetry: () => void
  onLoadOlder: () => void
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void
}

export function ConversationThread({
  conversation,
  activeUserIds,
  isConnected,
  currentUserId,
  currentUserName,
  messages,
  isPending,
  isError,
  isFetchingOlder,
  hasOlderMessages,
  draft,
  isSending,
  onDraftChange,
  onBack,
  onRetry,
  onLoadOlder,
  onSubmit,
}: ConversationThreadProps) {
  const messagesRef = useRef<HTMLDivElement>(null)
  const previousScrollRef = useRef<{ height: number; top: number } | null>(null)
  const activeChat = conversation.participants.some((person) =>
    activeUserIds.includes(person.id),
  )

  useEffect(() => {
    const element = messagesRef.current
    if (!element) return

    if (previousScrollRef.current) {
      // Keep the same message in view after older messages are added above it.
      const previous = previousScrollRef.current
      element.scrollTop = previous.top + element.scrollHeight - previous.height
      previousScrollRef.current = null
      return
    }

    element.scrollTop = element.scrollHeight
  }, [conversation.id, messages.length])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Back to conversations"
          onClick={onBack}
        >
          <ArrowLeft />
        </Button>
        <ParticipantAvatars
          participants={conversation.participants}
          activeUserIds={activeUserIds}
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">
            {conversationName(conversation.participants)}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {conversation.participants.length > 1
              ? `${conversation.participants.length} participants`
              : activeChat
                ? 'Active now'
                : isConnected
                  ? 'Offline'
                  : 'Connecting…'}
          </p>
        </div>
        {conversation.participants.length > 1 && (
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Users className="size-3.5" />
            Group conversation
          </span>
        )}
      </header>

      <div
        ref={messagesRef}
        onScroll={(event) => {
          const element = event.currentTarget
          if (element.scrollTop < 48 && hasOlderMessages && !isFetchingOlder) {
            // Save the scroll position before loading older messages.
            previousScrollRef.current = {
              height: element.scrollHeight,
              top: element.scrollTop,
            }
            onLoadOlder()
          }
        }}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8"
        aria-label="Messages"
      >
        {isPending ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm font-medium">Messages didn’t load</p>
            <Button variant="link" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : messages.length ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {isFetchingOlder && (
              <div className="flex justify-center py-2">
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {messages.map((message) => {
              const isMine = message.author_id === currentUserId
              const authorName =
                message.author?.fullName ||
                message.author?.username ||
                (isMine
                  ? currentUserName
                  : conversationName(conversation.participants))

              return (
                <article
                  key={message.id}
                  className={cn(
                    'flex items-end gap-2.5',
                    isMine && 'justify-end',
                  )}
                >
                  {!isMine && (
                    <Avatar size="sm" className="mb-1">
                      <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-[min(78%,38rem)]',
                      isMine && 'items-end',
                    )}
                  >
                    {!isMine && (
                      <p className="mb-1 px-1 text-[11px] text-muted-foreground">
                        {authorName}
                      </p>
                    )}
                    <p
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-sm leading-6 wrap-anywhere',
                        isMine
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md bg-muted',
                      )}
                    >
                      {message.content}
                    </p>
                    <time
                      className={cn(
                        'mt-1 block px-1 text-[10px] text-muted-foreground',
                        isMine && 'text-right',
                      )}
                      dateTime={message.created_at}
                    >
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </time>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-full border text-muted-foreground">
              <MessageSquareText className="size-5" />
            </div>
            <h3 className="text-sm font-medium">Say hello</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your conversation starts here.
            </p>
          </div>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="shrink-0 border-t p-3 sm:px-6 sm:py-4"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border bg-muted/30 p-2 focus-within:border-ring">
          <Textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder="Write a message…"
            rows={1}
            maxLength={5000}
            aria-label="Write a message"
            className="max-h-36 min-h-9 resize-y border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={!draft.trim() || isSending}
            aria-label="Send message"
            title="Send message"
          >
            {isSending ? <LoaderCircle className="animate-spin" /> : <Send />}
          </Button>
        </div>
        <p className="mx-auto mt-1.5 max-w-3xl px-1 text-[10px] text-muted-foreground">
          Enter to send · Shift + Enter for a new line
        </p>
      </form>
    </div>
  )
}
