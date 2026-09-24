import { dbPool } from '../db';
import { ProjectMilestone } from '../models/projectMilestones.model';

export const getProjectMilestones = async (
  projectId: string,
): Promise<ProjectMilestone[]> => {
  const result = await dbPool.query(
    `SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY created_at ASC, id ASC`,
    [projectId],
  );

  return result.rows;
};

export const getProjectMilestonesWithIdAndProjectId = async (
  id: string,
  projectId: string,
): Promise<ProjectMilestone> => {
  const results = await dbPool.query(
    `
    SELECT * FROM project_milestones
    WHERE id = $1 AND project_id = $2
    `,
    [id, projectId],
  );

  return results.rows[0];
};

export const createProjectMilestones = async (
  projectId: string,
  name: string,
  description?: string,
  targetDate?: string,
): Promise<ProjectMilestone> => {
  const results = await dbPool.query(
    `
    INSERT INTO project_milestones (
       project_id, name, description, target_date 
    )
    VALUES ($1, $2, $3, $4)
    RETURNING*
    `,
    [projectId, name, description ?? null, targetDate ?? null],
  );

  return results.rows[0];
};

export const updateProjectMilestones = async (
  id: string,
  payload: {
    name?: string;
    description?: string | null;
    target_date?: string | null;
  },
) => {
  const keys = Object.keys(payload);
  const values = Object.values(payload);

  const results = await dbPool.query(
    `
    UPDATE project_milestones
    SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')}, updated_at = current_timestamp
    WHERE id = $${keys.length + 1}
    `,
    [...values, id],
  );

  return results.rowCount;
};

export const deleteProjectMilestone = async (id: string) => {
  const results = await dbPool.query(
    `
    DELETE FROM project_milestones
    WHERE id = $1
    `,
    [id],
  );

  return results.rowCount;
};
