import { dbPool } from '../db';
import { WorkspaceMember } from '../models/workspace.model';

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

export { createWorkspaceMember };
