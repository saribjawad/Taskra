import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, MessageSquareText, Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ConversationList } from '#/components/chat/ConversationList'
import { ConversationThread } from '#/components/chat/ConversationThread'
import { NewConversationDialog } from '#/components/chat/NewConversationDialog'
import { useAuth } from '#/context/auth/auth-hook'
import { useWebsocketContextHook } from '#/context/websocket/websocket-hook'
import {
  useGetConversationMessages,
  useGetConversations,
  useSendConversationMessage,
} from '#/hooks/conversation.hooks'
import { cn } from '#/lib/utils'
import { addConversationToCache } from '#/lib/query-cache/conversation'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/inbox/chats',
)({
  component: ChatsPage,
})

function ChatsPage() {
  const { workspaceId } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { activeUserIds, isConnected, joinConversation, sendChatMessage } =
    useWebsocketContextHook()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newConversationOpen, setNewConversationOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')

  const initializedSelection = useRef(false)

  const conversationQuery = useGetConversations(workspaceId)
  const conversations =
    conversationQuery.data?.pages.flatMap((page) => page.conversations) ?? []
  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ?? null

  const messagesQuery = useGetConversationMessages(selectedId)
  // The API returns newest messages first; reverse the pages and messages for display.
  const messages =
    messagesQuery.data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.messages.slice().reverse()) ?? []

  const { mutateAsync: sendMessage, isPending: isSending } =
    useSendConversationMessage(selectedId ?? '', workspaceId)

  useEffect(() => {
    initializedSelection.current = false
    setSelectedId(null)
  }, [workspaceId])

  useEffect(() => {
    if (initializedSelection.current || conversationQuery.isPending) return
    initializedSelection.current = true
    // Open the first conversation after the list loads.
    if (conversations.length) setSelectedId(conversations[0].id)
  }, [conversationQuery.isPending, conversations])

  const loadMoreConversations = useCallback(() => {
    void conversationQuery.fetchNextPage()
  }, [conversationQuery.fetchNextPage])

  useEffect(() => {
    // Join the selected conversation after selection or websocket reconnect.
    if (selectedId && isConnected) joinConversation(selectedId)
  }, [selectedId, isConnected, joinConversation])

  async function submitMessage(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !selectedId || isSending) return

    setDraft('')
    try {
      const message = await sendMessage(content)
      // Broadcast only after the API has saved the message.
      sendChatMessage(selectedId, message)
    } catch {
      setDraft(content)
      toast.error('Message could not be sent')
    }
  }

  return (
    <section className="flex min-h-0 flex-1 overflow-hidden border-y bg-background md:mx-4 md:mb-4 md:rounded-xl md:border">
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        activeUserIds={activeUserIds}
        search={search}
        isPending={conversationQuery.isPending}
        isError={conversationQuery.isError}
        hasNextPage={conversationQuery.hasNextPage}
        isFetchingNextPage={conversationQuery.isFetchingNextPage}
        onSearchChange={setSearch}
        onSelect={setSelectedId}
        onNewConversation={() => setNewConversationOpen(true)}
        onRetry={() => void conversationQuery.refetch()}
        onLoadMore={loadMoreConversations}
      />

      {selectedConversation ? (
        <ConversationThread
          conversation={selectedConversation}
          activeUserIds={activeUserIds}
          isConnected={isConnected}
          currentUserId={user?.id}
          currentUserName={user?.fullName}
          messages={messages}
          isPending={messagesQuery.isPending}
          isError={messagesQuery.isError}
          isFetchingOlder={messagesQuery.isFetchingNextPage}
          hasOlderMessages={messagesQuery.hasNextPage}
          draft={draft}
          isSending={isSending}
          onDraftChange={setDraft}
          onBack={() => setSelectedId(null)}
          onRetry={() => void messagesQuery.refetch()}
          onLoadOlder={() => void messagesQuery.fetchNextPage()}
          onSubmit={submitMessage}
        />
      ) : (
        <div
          className={cn(
            'min-h-0 min-w-0 flex-1 flex-col items-center justify-center px-6 text-center',
            selectedId ? 'flex' : 'hidden md:flex',
          )}
        >
          {conversationQuery.isPending ? (
            <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <MessageSquareText className="size-5" />
              </div>
              <h2 className="text-sm font-semibold">Your conversations</h2>
              <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">
                Pick a conversation or start a new message with someone in your
                workspace.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setNewConversationOpen(true)}
              >
                <Plus /> New message
              </Button>
            </>
          )}
        </div>
      )}

      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        workspaceId={workspaceId}
        conversations={conversations}
        onCreated={({ id, participants, isGroup, title }) => {
          // Add the empty conversation locally so it can open before its first message.
          const groupParticipants = isGroup && user
            ? [
                ...participants,
                {
                  id: user.id,
                  username: user.username,
                  full_name: user.fullName,
                  member: 'admin' as const,
                },
              ]
            : participants

          addConversationToCache(queryClient, workspaceId, {
            id,
            conversationParticipantId: '',
            isGroup,
            title,
            lastMessage: null,
            participants: groupParticipants,
            createdAt: new Date().toISOString(),
          })
          setSelectedId(id)
        }}
      />
    </section>
  )
}
