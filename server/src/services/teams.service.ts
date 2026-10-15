import { dbPool } from '../db';
import { Team } from '../models/teams.model';

export const createTeam = async (
  workspaceId: string,
  name: string,
  identifier: string,
  description?: string,
): Promise<Team> => {
  const results = await dbPool.query(
    `
      INSERT INTO teams (name, identifier, description, workspace_id)
      VALUES ($1, $2, $3, $4)
      RETURNING*
    `,
    [name, identifier, description ?? null, workspaceId],
  );

  return results.rows[0];
};

export const getTeamsByWorkspaceId = async (
  workspaceId: string,
): Promise<Team[]> => {
  const results = await dbPool.query(
    `
      SELECT * FROM teams
      WHERE workspace_id = $1
    `,
    [workspaceId],
  );

  return results.rows;
};
