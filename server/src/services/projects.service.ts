import { dbPool } from '../db';
import {
  Project,
  ProjectPriorityType,
  ProjectStatusType,
} from '../models/projects.model';

export const getProjectById = async (id: string): Promise<Project> => {
  const result = await dbPool.query(
    `
    SELECT * FROM projects
    WHERE id = $1
    `,
    [id],
  );

  return result.rows[0];
};

export const createProject = async (payload: {
  name: string;
  short_summary?: string;
  description?: string;
  priority: ProjectPriorityType;
  status: ProjectStatusType;
  lead_id?: string;
  workspace_id: string;
  start_date?: Date;
  target_date?: Date;
}): Promise<Project> => {
  const keys = Object.keys(payload);
  const values = Object.values(payload);

  const result = await dbPool.query(
    `
      INSERT INTO projects (
      ${keys.map((k, i) => `${k}${i + 1 < keys.length ? ',' : ''}`).join(' ')}
      )
      VALUES 
      (${keys.map((_, i) => `$${i + 1}${i + 1 < keys.length ? ',' : ''}`).join(' ')})
      RETURNING *
     `,
    [...values],
  );

  return result.rows[0];
};

export const updateProject = async (
  id: string,
  payload: {
    name?: string;
    short_summary?: string;
    description?: string;
    priority?: ProjectPriorityType;
    status?: ProjectStatusType;
    lead_id?: string;
    start_date?: Date;
    target_date?: Date;
  },
) => {
  const keys = Object.keys(payload);
  const values = Object.values(payload);

  const result = await dbPool.query(
    `
    UPDATE projects 
    SET ${keys.map((k, i) => `${k} = $${i + 1}${i + 1 < keys.length ? ',' : ''}`)}
    WHERE id = $${keys.length + 1}`,
    [...values, id],
  );

  return result.rowCount;
};
