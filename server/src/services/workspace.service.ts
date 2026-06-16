import { dbPool } from '../db';
import { Workspace } from '../models/workspace.model';

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
    DELETE FROM workspace WHERE
    id = $1
    `,
    [workspaceId],
  );

  return result.rowCount;
};

export { createWorkspace, deleteWorkspace };
