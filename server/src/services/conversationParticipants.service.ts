import { dbPool } from '../db';
import {
  ConversationParticipant,
  ConversationParticipantMemberType,
} from '../models/conversationParticipants.model';

export const createConversationParticipant = async (
  userId: string,
  conversationId: string,
  memberRole?: ConversationParticipantMemberType | null,
) => {
  const results = await dbPool.query(
    `
    INSERT INTO conversation_participants (user_id, conversation_id, member)
    VALUES ($1, $2, $3)
    RETURNING*
    `,
    [userId, conversationId, memberRole ?? null],
  );

  return results.rows[0];
};

export const getConversationParticipantByUserId = async (
  id: string,
  conversationId: string,
): Promise<ConversationParticipant> => {
  const results = await dbPool.query(
    `
    SELECT * FROM conversation_participants
    WHERE user_id = $1 AND conversation_id = $2
    `,
    [id, conversationId],
  );

  return results.rows[0];
};
