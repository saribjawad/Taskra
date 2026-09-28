import { meta } from 'zod/v4/core';
import { dbPool } from '../db';
import {
  ProjectActivityType,
  ProjectActivty,
} from '../models/projectActivity.model';

export const createProjectActivity = async (
  projectId: string,
  userId: string,
  description: string,
  type: ProjectActivityType,
  metadata: {
    field: string;
    from: string;
    to: string;
  } | null = null,
): Promise<ProjectActivty> => {
  const results = await dbPool.query(
    `
    INSERT INTO project_activity (project_id, user_id, description, type, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING*
    `,
    [projectId, userId, description, type, metadata],
  );

  return results.rows[0];
};

export const getProjectActivity = async (
  projectId: string,
  limit: number,
  cursorId: string | undefined,
  cursorTime: Date | undefined,
): Promise<ProjectActivty[]> => {
  const results = await dbPool.query(
    `
    SELECT * FROM project_activity
    WHERE project_id = $1
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
