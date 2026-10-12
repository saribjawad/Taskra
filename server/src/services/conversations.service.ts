import { dbPool } from '../db';
import { Conversation } from '../models/conversations.model';

export const createConversation = async (
  workspaceId: string,
): Promise<Conversation> => {
  const results = await dbPool.query(
    `
      INSERT INTO conversations (workspace_id)
      VALUES ($1)
      RETURNING*
    `,
    [workspaceId],
  );

  return results.rows[0];
};

export const getExistingConversationByParticipants = async (
  participants: string[],
): Promise<{
  conversation_id: string;
}> => {
  const results = await dbPool.query(
    `
    SELECT conversation_id
    FROM conversation_participants
    WHERE conversation_id = ANY (
      SELECT conversation_id
      FROM conversation_participants
      WHERE user_id = ANY ($1::uuid[])
    )
    GROUP BY conversation_id
    HAVING
      COUNT(user_id) = ${participants.length}
      AND
      COUNT(user_id) FILTER (WHERE user_id = ANY ($1::uuid[])) = ${participants.length}
    `,
    [participants],
  );

  return results.rows[0];
};

export const getConversationsUserIsPartOf = async (
  userId: string,
): Promise<{ conversation_id: string }[]> => {
  const results = await dbPool.query(
    `
    SELECT conversation_id FROM conversation_participants WHERE user_id = $1;
    `,
    [userId],
  );

  return results.rows;
};

export const getConversationByIdAndWorkspaceId = async (
  id: string,
  workspaceId: string,
): Promise<Conversation> => {
  const results = await dbPool.query(
    `
    SELECT * FROM conversations
    WHERE id = $1 AND workspace_id = $2
    `,
    [id, workspaceId],
  );

  return results.rows[0];
};

export const addLastMessageOnConversation = async (
  id: string,
  lastMessageId: string,
  lastMessageDate: Date,
) => {
  const results = await dbPool.query(
    `
      UPDATE conversations
      SET last_message_id = $2, last_message_date = $3
      WHERE id = $1
    `,
    [id, lastMessageId, lastMessageDate],
  );

  return results.rowCount;
};
