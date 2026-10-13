export interface ConversationPerson {
  id: string
  username: string
  full_name?: string
}

export interface ConversationPreviewMessage {
  id: string
  content: string
  created_at: string
}

export interface Conversation {
  id: string
  conversationParticipantId: string
  lastMessage: ConversationPreviewMessage | null
  participants: ConversationPerson[]
  createdAt: string
}

export interface ConversationPage {
  conversations: Conversation[]
  cursor: { id: string | null; time: string | null } | null
  hasNextPage: boolean
}

export interface ConversationMessagesPage {
  messages: ChatMessage[]
  hasNextPage: boolean | null
  cursor: { id: string | null; time: string | null } | null
}

export interface ChatMessage {
  id: string
  conversation_id: string
  author_id: string
  conversation_participant_id: string
  content: string
  is_edited: boolean
  created_at: string
  updated_at: string
  author?: {
    id: string
    username: string
    fullName: string
  }
}
