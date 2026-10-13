export interface Conversation {
  id: string;
  workspace_id: string;
  last_message_id: string;
  last_message_date: Date;
  created_at: Date;
}

export interface UsersConversations {
  id: string;
  conversation_participant_id: string;
  last_message: {
    id: string;
    content: string;
    created_at: string;
  };
  created_at: Date;
  created_at_cursor: string;
}

export interface ConversationParticipants {
  conversation_id: string;
  recipient: {
    id: string;
    username: string;
    full_name: string;
  };
}
