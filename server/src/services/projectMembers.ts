import { dbPool } from '../db';
import {
  ProjectMember,
  ProjectMemberWithUser,
} from '../models/projectMembers.model';

export const createProjectMember = async (
  userId: string,
  projectId: string,
) => {
  const results = await dbPool.query(
    `
    INSERT INTO project_members 
    (user_id, project_id)
    VALUES ($1, $2)
    RETURNING*
    `,
    [userId, projectId],
  );

  return results.rows[0];
};

export const getProjectMembers = async (
  projectId: string,
): Promise<ProjectMemberWithUser[]> => {
  const results = await dbPool.query(
    `
      SELECT
          pm.id,
          pm.project_id,
          pm.updated_at,
          pm.created_at,
          json_build_object ('id', u.id, 'username', u.username, 'email', u.email) AS user
      FROM
          project_members as pm
          LEFT JOIN users as u ON pm.user_id = u."id"
      WHERE
          project_id = $1
    `,
    [projectId],
  );

  return results.rows;
};
