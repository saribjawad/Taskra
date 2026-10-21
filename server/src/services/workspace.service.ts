import { PoolClient } from 'pg';
import { dbPool } from '../db';
import {
  Workspace,
  WorkspaceMemberRole,
  WorkspaceMemberWithUserDetails,
} from '../models/workspace.model';
import { WorkspaceMember } from '../models/workspace.model';

/**
 * Get workspace
 *
 * @param workspaceId - workspace UUID
 * @returns the workspace created
 */
const getWorkspaceById = async (workspaceId: string): Promise<Workspace> => {
  const result = await dbPool.query(
    `
    SELECT * FROM workspace
    WHERE id = $1
    `,
    [workspaceId],
  );

  return result.rows[0];
};

/**
 * Get workspaces of a user
 *
 * @param userId - user UUID
 * @returns the workspace created
 */
const getUserWorkspaces = async (userId: string) => {
  const result = await dbPool.query(
    `
    SELECT w.id, w.name FROM workspace_members AS wm
    JOIN workspace AS w
    ON w.id = wm.workspace_id
    WHERE wm.user_id = $1
    `,
    [userId],
  );

  return result.rows;
};

/**
 *
 * @param userIds - Array of user's UUID
 * @param workspaceId - Workspace UUID
 * @returns workspace members
 */
const getWorkspaceMembers = async (
  userIds: string[],
  workspaceId: string,
): Promise<WorkspaceMemberWithUserDetails[]> => {
  const results = await dbPool.query(
    `
    SELECT
    wm.id,
    wm.workspace_id,
    wm.role,
    wm.joined_at,
    json_build_object ('id', u.id, 'username', u.username, 'full_name', u.full_name, 'email', u.email) as user
FROM
    workspace_members as wm
    INNER JOIN users as u ON u.id = wm.user_id
    WHERE
    wm.user_id = ANY($1::uuid[])
    AND wm.workspace_id = $2;
    `,
    [userIds, workspaceId],
  );

  return results.rows;
};

/**
 * Get workspace membership of a user
 *
 * @param userId - user UUID
 * @param workspaceId - workspace UUID
 * @returns workspace member
 */
const getWorkspaceMember = async (
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMember> => {
  const result = await dbPool.query(
    `
    SELECT * FROM workspace_members
    WHERE user_id = $1
    AND workspace_id = $2;
    `,
    [userId, workspaceId],
  );

  return result.rows[0];
};

/**
 * Create a workspace
 *
 * @param name - Workspace name
 * @returns the workspace created
 */
const createWorkspace = async (
  payload: { name: string },
  txClient?: PoolClient,
): Promise<Workspace> => {
  const { name } = payload;

  const db = txClient || dbPool;
  const result = await db.query(
    `
    INSERT INTO workspace (name)
    VALUES ($1)
    RETURNING*
    `,
    [name],
  );

  return result.rows[0];
};

/**
 * Delete a workspace
 *
 * @param workspaceId - Workspace UUID
 * @returns the workspace created
 */
const deleteWorkspace = async (workspaceId: string) => {
  const result = await dbPool.query(
    `
    DELETE FROM workspace
    WHERE id = $1
    `,
    [workspaceId],
  );

  return result.rowCount;
};

/**
 * Create a workspace member
 *
 * @param userId - UUID of user
 * @param workspaceID - UUID of workspace
 * @returns the workspace member created
 */
const createWorkspaceMember = async (
  payload: {
    userId: string;
    workspaceId: string;
    role: WorkspaceMemberRole;
  },
  txClient?: PoolClient,
): Promise<WorkspaceMember> => {
  const { role, userId, workspaceId } = payload;

  const db = txClient || dbPool;
  const result = await db.query(
    `
    INSERT INTO workspace_members (user_id, workspace_id, role)
    VALUES ($1, $2, $3)
    RETURNING*
    `,
    [userId, workspaceId, role],
  );

  return result.rows[0];
};

/**
 * Delete a workspace member
 *
 * @param userId - UUID of user
 * @param workspaceID - UUID of workspace
 * @returns number of rows deleted
 */
const deleteWorkspaceMember = async (
  userId: string,
  workspaceId: string,
): Promise<number | null> => {
  const result = await dbPool.query(
    `
    DELETE FROM workspace_members
    WHERE user_id = $1 AND workspace_id = $2
    `,
    [userId, workspaceId],
  );

  return result.rowCount;
};

/**
 * Get workspace members
 *
 * @param workspaceID - UUID of workspace
 * @returns rows of workspace users
 */
const getWorkspaceUsers = async (workspaceId: string) => {
  const results = await dbPool.query(
    `
    SELECT u.id, u.username, u.email, wm.role, wm.joined_at
    FROM workspace_members wm
    INNER JOIN users u
      ON u.id = wm.user_id
    WHERE wm.workspace_id = $1;
    `,
    [workspaceId],
  );

  return results.rows;
};

export {
  getWorkspaceById,
  createWorkspace,
  deleteWorkspace,
  getUserWorkspaces,
  getWorkspaceMember,
  createWorkspaceMember,
  deleteWorkspaceMember,
  getWorkspaceUsers,
  getWorkspaceMembers,
};
