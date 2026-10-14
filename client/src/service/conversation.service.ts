import { api } from '#/lib/api'
import type {
  ChatMessage,
  ConversationMessagesPage,
  ConversationPage,
} from '#/type/conversation'

export async function getConversations(cursor?: { id: string; time: string }) {
  const response = await api.get('/conversations', {
    params: cursor
      ? { cursorId: cursor.id, cursorTime: cursor.time }
      : undefined,
  })

  // The current API omits data when the user has no conversations.
  const data = response.data.data
  if (!data) {
    return { conversations: [], cursor: null, hasNextPage: false }
  }

  return {
    ...data,
    conversations: data.conversations.map((conversation: any) => {
      // Group conversations return recipient rows; direct conversations return one recipient.
      const recipients = Array.isArray(conversation.recipient)
        ? conversation.recipient.map((entry: any) => entry.recipient)
        : [conversation.recipient]

      return {
        ...conversation,
        isGroup: conversation.isGroup ?? false,
        title: conversation.title ?? null,
        participants: conversation.participants ?? recipients.filter(Boolean),
      }
    }),
  } as ConversationPage
}

export interface CreateConversationInput {
  participants: string[]
  isGroup?: boolean
  title?: string
}

export async function createConversation(input: CreateConversationInput) {
  const response = await api.post('/conversations', input)
  return response.data.data as string
}

export async function getConversationMessages(
  conversationId: string,
  cursor?: { id: string; time: string },
): Promise<ConversationMessagesPage> {
  const response = await api.get(`/conversations/${conversationId}/messages`, {
    params: cursor
      ? { cursorId: cursor.id, cursorTime: cursor.time }
      : undefined,
  })
  const data = response.data.data

  return {
    ...data,
    messages: data.messages.map((message: any) => ({
      id: message.id,
      conversation_id: message.conversationId,
      author_id: message.sender.id,
      content: message.content,
      is_edited: message.isEdited,
      created_at: message.createdAt,
      updated_at: message.updatedAt,
      author: {
        id: message.sender.id,
        username: message.sender.username,
        fullName: message.sender.full_name,
      },
    })),
  }
}

export async function sendConversationMessage(
  conversationId: string,
  content: string,
) {
  const response = await api.post(`/messages/${conversationId}/send`, {
    content,
  })

  return response.data.data as ChatMessage
}
