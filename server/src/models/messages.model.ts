export interface Message {
  id: string;
  conversation_id: string;
  author_id: string;
  conversation_participant_id: string;
  is_edited: Boolean;
  updated_at: Date;
  created_at: Date;
}
