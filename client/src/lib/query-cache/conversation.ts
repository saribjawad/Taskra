import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type {
  ChatMessage,
  Conversation,
  ConversationMessagesPage,
  ConversationPage,
} from '#/type/conversation'

export function addConversationToCache(
  queryClient: QueryClient,
  workspaceId: string,
  conversation: Conversation,
) {
  queryClient.setQueryData<InfiniteData<ConversationPage>>(
    ['conversations', workspaceId],
    (current) => {
      if (!current) {
        return {
          pages: [
            { conversations: [conversation], cursor: null, hasNextPage: false },
          ],
          pageParams: [undefined],
        }
      }

      if (current.pages.some((page) =>
        page.conversations.some((item) => item.id === conversation.id),
      )) {
        return current
      }

      const [firstPage, ...remainingPages] = current.pages
      return {
        ...current,
        pages: [
          {
            ...firstPage,
            conversations: [conversation, ...firstPage.conversations],
          },
          ...remainingPages,
        ],
      }
    },
  )
}

export function addConversationMessageToCache(
  queryClient: QueryClient,
  workspaceId: string,
  conversationId: string,
  message: ChatMessage,
) {
  queryClient.setQueryData<InfiniteData<ConversationMessagesPage>>(
    ['conversation-messages', conversationId],
    (current) => {
      if (!current) return current

      const alreadyExists = current.pages.some((page) =>
        page.messages.some((item) => item.id === message.id),
      )
      if (alreadyExists) return current

      const [newestPage, ...olderPages] = current.pages
      return {
        ...current,
        pages: [
          {
            ...newestPage,
            messages: [message, ...newestPage.messages],
          },
          ...olderPages,
        ],
      }
    },
  )

  queryClient.setQueryData<InfiniteData<ConversationPage>>(
    ['conversations', workspaceId],
    (current) => {
      if (!current) return current

      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          conversations: page.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  lastMessage: {
                    id: message.id,
                    content: message.content,
                    created_at: message.created_at,
                  },
                }
              : conversation,
          ),
        })),
      }
    },
  )

  void queryClient.invalidateQueries({
    queryKey: ['conversations', workspaceId],
  })
}
