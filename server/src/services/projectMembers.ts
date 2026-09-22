import { dbPool } from '../db';

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
