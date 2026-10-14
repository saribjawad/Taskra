export type ConversationParticipantMemberType = 'member' | 'admin';

export interface ConversationParticipant {
  id: string;
  user_id: string;
  member: ConversationParticipantMemberType | null;
  conversation_id: string;
  created_at: Date;
}
