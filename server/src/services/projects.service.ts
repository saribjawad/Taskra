import { PoolClient } from 'pg';
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
          p.team_id,
          json_build_object('id', t.id, 'name', t.name) AS team,
          p.start_date,
          p.target_date,
          p.updated_at,
          p.created_at,
          json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS lead
      FROM
          projects AS p
          LEFT JOIN users AS u ON p.lead_id = u.id
          JOIN teams AS t ON p.team_id = t.id
      WHERE
          p.id = $1
          AND p.workspace_id = $2;
    `,
    [projectId, workspaceId],
  );

  return result.rows[0];
};

export const getProjectTaskProgress = async (projectId: string) => {
  const [totals, assignees] = await Promise.all([
    dbPool.query(
      `
      SELECT
        COUNT(*)::int AS scope,
        COUNT(*) FILTER (WHERE status = 'done')::int AS completed
      FROM tasks
      WHERE project_id = $1
      `,
      [projectId],
    ),
    dbPool.query(
      `
      SELECT
        users.id,
        users.username,
        users.email,
        COUNT(*)::int AS task_count
      FROM tasks
      JOIN users ON users.id = tasks.assignee
      WHERE tasks.project_id = $1
      GROUP BY users.id, users.username, users.email
      ORDER BY task_count DESC, users.username ASC
      `,
      [projectId],
    ),
  ]);

  return {
    scope: totals.rows[0].scope as number,
    completed: totals.rows[0].completed as number,
    assignees: assignees.rows.map((assignee) => ({
      id: assignee.id as string,
      username: assignee.username as string,
      email: assignee.email as string,
      taskCount: assignee.task_count as number,
    })),
  };
};

export const getProjectsByWorkspaceId = async (
  workspaceId: string,
  limit: number,
  offset: number,
): Promise<Project[]> => {
  const result = await dbPool.query(
    `
    SELECT projects.*, json_build_object('id', teams.id, 'name', teams.name) AS team
    FROM projects
    JOIN teams ON teams.id = projects.team_id
    WHERE projects.workspace_id = $1
    ORDER BY projects.created_at DESC, projects.id DESC
    LIMIT $2
    OFFSET $3
    `,
    [workspaceId, limit, offset],
  );

  return result.rows;
};

export const getProjectsByTeamId = async (
  teamId: string,
  limit: number,
  offset: number,
): Promise<Project[]> => {
  const result = await dbPool.query(
    `
    SELECT projects.*, json_build_object('id', teams.id, 'name', teams.name) AS team
    FROM projects
    JOIN teams ON teams.id = projects.team_id
    WHERE projects.team_id = $1
    ORDER BY projects.created_at DESC, projects.id DESC
    LIMIT $2 OFFSET $3
    `,
    [teamId, limit, offset],
  );

  return result.rows;
};

export const createProject = async (
  payload: {
    name: string;
    short_summary?: string;
    description?: string;
    priority: ProjectPriorityType;
    status: ProjectStatusType;
    lead_id?: string;
    workspace_id: string;
    team_id: string;
    start_date?: Date;
    target_date?: Date;
  },
  txClient?: PoolClient,
): Promise<Project> => {
  const keys = Object.keys(payload);
  const values = Object.values(payload);

  const db = txClient || dbPool;
  const result = await db.query(
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
  payload: {
    id: string;
    name?: string;
    short_summary?: string;
    description?: string;
    priority?: ProjectPriorityType;
    status?: ProjectStatusType;
    lead_id?: string;
    start_date?: Date;
    target_date?: Date;
  },
  txClient?: PoolClient,
) => {
  const { id, ...data } = payload;
  const keys = Object.keys(data);
  const values = Object.values(data);

  const db = txClient || dbPool;
  const result = await db.query(
    `
    UPDATE projects
    SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')}
    WHERE id = $${keys.length + 1}`,
    [...values, id],
  );

  return result.rowCount;
};

export const deleteProject = async (id: string) => {
  const result = await dbPool.query(`DELETE FROM projects WHERE id = $1`, [id]);

  return result.rowCount;
};
