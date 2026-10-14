export interface Conversation {
  id: string;
  workspace_id: string;
  last_message_id: string;
  last_message_date: Date;
  title: string | null;
  is_group: Boolean;
  created_at: Date;
}

export interface UsersConversations {
  id: string;
  conversation_participant_id: string;
  is_group: Boolean;
  title: string | null;
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

export interface ConversationMessage {
  id: string;
  content: string;
  conversation_id: string;
  is_edited: boolean;
  sender: {
    id: string;
    username: string;
    full_name: string;
  };
  created_at: string;
  created_at_cursor: string;
  updated_at: string;
}
