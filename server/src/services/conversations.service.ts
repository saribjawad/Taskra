import { dbPool } from '../db';
import {
  Conversation,
  ConversationParticipants,
  UsersConversations,
} from '../models/conversations.model';

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

export const getUsersConversations = async (
  userId: string,
  limit: number,
  cursorId?: string,
  cursorDate?: string,
): Promise<UsersConversations[]> => {
  const results = await dbPool.query(
    `
    SELECT
        c."id",
        c.created_at,
        cp."id" as conversation_participant_id,
        to_char(c.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as created_at_cursor,
        json_build_object('id', m.id, 'content', m."content", 'created_at', m.created_at) AS last_message
    FROM
        conversation_participants as cp
        JOIN conversations as c on c.id = cp.conversation_id
        JOIN messages as m on c.last_message_id = m."id"
    WHERE
        user_id = $1
        AND
          (
            $2::timestamptz IS NULL
            OR (c.created_at, c.id) < ($2::timestamptz, $3::uuid)
          )
    ORDER BY c.created_at DESC, c.id DESC
    LIMIT $4
    `,
    [userId, cursorDate ?? null, cursorId ?? null, limit],
  );

  return results.rows;
};

export const getConversationParticipantsExceptUser = async (
  conversationIds: string[],
  userId: string,
): Promise<ConversationParticipants[]> => {
  const results = await dbPool.query(
    `
    SELECT
        cp.conversation_id as conversation_id ,json_build_object('id', u.id, 'username', u.username, 'full_name', u.full_name) AS recipient
    FROM
        conversation_participants AS cp
        JOIN users AS u ON cp.user_id = u.id
    WHERE
        cp.conversation_id = ANY ($1::uuid[])
    AND
        cp.user_id <> $2
    `,
    [conversationIds, userId],
  );

  return results.rows;
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
