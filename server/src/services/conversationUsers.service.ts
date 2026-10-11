import { dbPool } from '../db';

export const createConversationUser = async (
  userId: string,
  conversationId: string,
) => {
  const results = await dbPool.query(
    `
    INSERT INTO conversation_users (user_id, conversation_id)
    VALUES ($1, $2)
    RETURNING*
    `,
    [userId, conversationId],
  );

  return results.rows[0];
};
