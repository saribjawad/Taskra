import { dbPool } from '../db';
import { ProjectMilestone } from '../models/projectMilestones.model';

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
    description?: string;
    target_date?: string;
  },
) => {
  const keys = Object.keys(payload);
  const values = Object.values(payload);

  const results = await dbPool.query(
    `
    UPDATE project_milestones
    SET ${keys.map((k, i) => `${k} = $${i + 1}${i + 1 < keys.length ? ',' : ''}`)}
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
