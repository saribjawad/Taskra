import { dbPool } from '../db';
import {
  ProjectActivityType,
  ProjectActivity,
  ProjectActivityWithComments,
} from '../models/projectActivity.model';
import { PoolClient } from 'pg';

export const createProjectActivity = async (
  payload: {
    projectId: string;
    userId: string;
    description: string;
    type: ProjectActivityType;
    metadata?: {
      field: string;
      from: string;
      to: string;
    };
  },
  txClient?: PoolClient,
): Promise<ProjectActivity> => {
  const { description, projectId, type, userId, metadata } = payload;

  const db = txClient || dbPool;
  const results = await db.query(
    `
    INSERT INTO project_activity (project_id, user_id, description, type, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING*
    `,
    [projectId, userId, description, type, metadata ?? null],
  );

  return results.rows[0];
};

export const getProjectActivity = async (
  projectId: string,
  limit: number,
  cursorId: string | undefined,
  cursorTime: Date | undefined,
): Promise<ProjectActivityWithComments[]> => {
  const results = await dbPool.query(
    `
      SELECT * FROM (
      SELECT
          c.id,
          c.project_id,
          c.user_id,
          u.username,
          c.content,
          null::text AS type,
          null::jsonb AS metadata,
          null::text AS description,
          'comment'::text AS activity_type,
          c.updated_at,
          c.created_at
        FROM comments AS c
        INNER JOIN users AS u ON u.id = c.user_id

      UNION ALL

      SELECT
          a.id,
          a.project_id,
          a.user_id,
          u.username,
          null::text AS content,
          a.type,
          a.metadata,
          a.description,
          'activity'::text AS activity_type,
          null::timestamptz AS updated_at,
          a.created_at
        FROM project_activity AS a
        INNER JOIN users AS u ON u.id = a.user_id
      ) WHERE project_id = $1
      AND (
          $2::timestamptz IS NULL
          OR (created_at, id) < ($2::timestamptz, $3::uuid)
          )
        ORDER BY created_at DESC, id DESC
          LIMIT $4
    `,
    [projectId, cursorTime ?? null, cursorId ?? null, limit],
  );

  return results.rows;
};
