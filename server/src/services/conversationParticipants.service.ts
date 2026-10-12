import { dbPool } from '../db';
import { ConversationParticipant } from '../models/conversationParticipants.model';

export const createConversationParticipant = async (
  userId: string,
  conversationId: string,
) => {
  const results = await dbPool.query(
    `
    INSERT INTO conversation_participants (user_id, conversation_id)
    VALUES ($1, $2)
    RETURNING*
    `,
    [userId, conversationId],
  );

  return results.rows[0];
};

export const getConversationParticipantByUserId = async (
  id: string,
): Promise<ConversationParticipant> => {
  const results = await dbPool.query(
    `
    SELECT * FROM conversation_participants
    WHERE user_id = $1
    `,
    [id],
  );

  return results.rows[0];
};
