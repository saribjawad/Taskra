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
