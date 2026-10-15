import { dbPool } from '../db';
import { Team } from '../models/teams.model';

export const createTeam = async (
  workspaceId: string,
  name: string,
  description?: string,
): Promise<Team> => {
  const results = await dbPool.query(
    `
      INSERT INTO teams (name, description, workspace_id)
      VALUES ($1, $2, $3)
      RETURNING*
    `,
    [name, description ?? null, workspaceId],
  );

  return results.rows[0];
};
