import { dbPool } from '../db';
import {
  Project,
  ProjectPriorityType,
  ProjectStatusType,
  ProjectWithLead,
} from '../models/projects.model';

export const getProjectByIdAndWorkspaceId = async (
  id: string,
  workspaceId: string,
): Promise<Project> => {
  const result = await dbPool.query(
    `
    SELECT * FROM projects
    WHERE id = $1 AND workspace_id = $2
    `,
    [id, workspaceId],
  );

  return result.rows[0];
};

export const getProjectWithLeadDetails = async (
  projectId: string,
  workspaceId: string,
): Promise<ProjectWithLead> => {
  const result = await dbPool.query(
    `
       SELECT
          p.id,
          p.name,
          p.short_summary,
          p.description,
          p.priority,
          p.status,
          p.workspace_id,
          p.start_date,
          p.target_date,
          p.updated_at,
          p.created_at,
          json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS lead
      FROM
          projects AS p
          LEFT JOIN users AS u ON p.lead_id = u.id
      WHERE
          p.id = $1
          AND p.workspace_id = $2;
    `,
    [projectId, workspaceId],
  );

  return result.rows[0];
};

export const getProjectsByWorkspaceId = async (
  workspaceId: string,
  limit: number,
  offset: number,
): Promise<Project[]> => {
  const result = await dbPool.query(
    `
    SELECT * FROM projects
    WHERE workspace_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    OFFSET $3
    `,
    [workspaceId, limit, offset],
  );

  return result.rows;
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

export const deleteProject = async (id: string) => {
  const result = await dbPool.query(`DELETE FROM projects WHERE id = $1`, [id]);

  return result.rowCount;
};
