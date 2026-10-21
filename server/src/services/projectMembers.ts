import { PoolClient } from 'pg';
import { dbPool } from '../db';
import {
  ProjectMember,
  ProjectMemberWithUser,
  ProjectMemberWithUserId,
} from '../models/projectMembers.model';

export const createProjectMember = async (
  payload: {
    userId: string;
    projectId: string;
  },
  txClient?: PoolClient,
): Promise<ProjectMember> => {
  const { projectId, userId } = payload;

  const db = txClient || dbPool;
  const results = await db.query(
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

export const deleteProjectMember = async (
  payload: {
    id: string;
    projectId: string;
  },
  txClient?: PoolClient,
) => {
  const { id, projectId } = payload;

  const db = txClient || dbPool;
  const results = await db.query(
    `
    DELETE FROM project_members
    WHERE id = $1 AND project_id = $2
    `,
    [id, projectId],
  );

  return results.rowCount;
};

export const getProjectMemberByIdAndProjectId = async (
  id: string,
  projectId: string,
): Promise<ProjectMember> => {
  const results = await dbPool.query(
    `
    SELECT * FROM project_members
    WHERE id = $1 AND project_id = $2
    `,
    [id, projectId],
  );

  return results.rows[0];
};

export const getProjectMembersWithUserDetail = async (
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

export const getProjectMembersByProjectId = async (
  payload: { projectId: string },
  txClient?: PoolClient,
): Promise<ProjectMember[]> => {
  const { projectId } = payload;
  const db = txClient || dbPool;
  const results = await db.query(
    `
    SELECT * FROM project_members
    WHERE project_id = $1
    `,
    [projectId],
  );

  return results.rows;
};

export const getProjectMembersByUserIdsAndProjectId = async (
  memberIds: string[],
  projectId: string,
): Promise<ProjectMemberWithUserId[]> => {
  const results = await dbPool.query(
    `
      SELECT
        pm.id,
        pm.project_id,
        pm.user_id,
        pm.updated_at,
        pm.created_at,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'full_name', u.full_name,
          'email', u.email
        ) AS user
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.id = ANY($1::uuid[])
        AND pm.project_id = $2
    `,
    [memberIds, projectId],
  );

  return results.rows;
};
