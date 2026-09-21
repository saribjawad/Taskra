import { dbPool } from '../db';
import {
  Project,
  ProjectPriorityType,
  ProjectStatusType,
} from '../models/projects.model';

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

  const query = `INSERT INTO projects (
      ${keys.map((k, i) => `${k}${i + 1 < keys.length ? ',' : ''}`).join(' ')}
      )
      VALUES 
      (${keys.map((_, i) => `$${i + 1}${i + 1 < keys.length ? ',' : ''}`).join(' ')})
      RETURNING *
     `;
  console.log(query);

  const result = await dbPool.query(query, [...values]);

  return result.rows[0];
};
