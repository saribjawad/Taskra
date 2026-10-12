import { dbPool } from '../db';
import { Message } from '../models/messages.model';

export const createMessage = async (
  conversationId: string,
  authorId: string,
  conversationParticipantId: string,
  content: string,
): Promise<Message> => {
  const results = await dbPool.query(
    `
    INSERT INTO messages(conversation_id, author_id, conversation_participant_id, content)
    VALUES ($1, $2, $3, $4)
    RETURNING*
   `,
    [conversationId, authorId, conversationParticipantId, content],
  );

  return results.rows[0];
};
