import {
  createConversation,
  getConversationMessages,
  getConversations,
  sendConversationMessage,
} from '#/service/conversation.service'
import { addConversationMessageToCache } from '#/lib/query-cache/conversation'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

export function useGetConversations(workspaceId: string) {
  return useInfiniteQuery({
    queryKey: ['conversations', workspaceId],
    initialPageParam: undefined as { id: string; time: string } | undefined,
    queryFn: ({ pageParam }) => getConversations(pageParam),
    getNextPageParam: (page) => {
      if (!page.hasNextPage || !page.cursor?.id || !page.cursor.time) {
        return undefined
      }

      return { id: page.cursor.id, time: page.cursor.time }
    },
    enabled: Boolean(workspaceId),
  })
}

export function useCreateConversation() {
  return useMutation({
    mutationFn: createConversation,
  })
}

export function useGetConversationMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: ['conversation-messages', conversationId],
    initialPageParam: undefined as { id: string; time: string } | undefined,
    queryFn: ({ pageParam }) =>
      getConversationMessages(conversationId!, pageParam),
    getNextPageParam: (page) => {
      if (!page.hasNextPage || !page.cursor?.id || !page.cursor.time) {
        return undefined
      }

      return { id: page.cursor.id, time: page.cursor.time }
    },
    enabled: Boolean(conversationId),
  })
}

export function useSendConversationMessage(
  conversationId: string,
  workspaceId: string,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) =>
      sendConversationMessage(conversationId, content),
    onSuccess: (message) => {
      addConversationMessageToCache(
        queryClient,
        workspaceId,
        conversationId,
        message,
      )
    },
  })
}
