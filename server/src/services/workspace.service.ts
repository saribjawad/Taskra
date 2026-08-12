import { dbPool } from '../db';
import { Workspace } from '../models/workspace.model';
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
 * Get workspaces of a user
 *
 * @param userId - user UUID
 * @param workspaceId - workspace UUID
 * @returns the workspace created
 */
const getWorkspaceMember = async (userId: string, workspaceId: string) => {
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
const createWorkspace = async (name: string): Promise<Workspace> => {
  const result = await dbPool.query(
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
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMember> => {
  const result = await dbPool.query(
    `
    INSERT INTO workspace_members (user_id, workspace_id)
    VALUES ($1, $2)
    RETURNING*
    `,
    [userId, workspaceId],
  );

  return result.rows[0];
};

export {
  getWorkspaceById,
  createWorkspace,
  deleteWorkspace,
  getUserWorkspaces,
  getWorkspaceMember,
  createWorkspaceMember,
};
