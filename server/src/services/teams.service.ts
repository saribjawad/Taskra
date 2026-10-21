import { PoolClient } from 'pg';
import { dbPool } from '../db';
import { Team } from '../models/teams.model';
import { DeletePublicAccessBlock$ } from '@aws-sdk/client-s3';

export const createTeam = async (
  payload: {
    workspaceId: string;
    name: string;
    identifier: string;
    description?: string;
  },
  txClient?: PoolClient,
): Promise<Team> => {
  const { identifier, name, workspaceId, description } = payload;

  const db = txClient || dbPool;
  const results = await db.query(
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

export const getTeamByIdAndWorkspaceId = async (
  teamId: string,
  workspaceId: string,
): Promise<Team> => {
  const results = await dbPool.query(
    `SELECT * FROM teams WHERE id = $1 AND workspace_id = $2`,
    [teamId, workspaceId],
  );

  return results.rows[0];
};

export const getTeamsCountByWorkspaceId = async (
  workspaceId: string,
): Promise<number> => {
  const result = await dbPool.query(
    'SELECT COUNT(*)::int AS count FROM teams WHERE workspace_id = $1',
    [workspaceId],
  );
  return result.rows[0].count;
};

export const getTeamDocumentCount = async (teamId: string): Promise<number> => {
  const result = await dbPool.query(
    'SELECT COUNT(*)::int AS count FROM team_documents WHERE team_id = $1',
    [teamId],
  );
  return result.rows[0].count;
};

export const getTeamLinkCount = async (teamId: string): Promise<number> => {
  const result = await dbPool.query(
    'SELECT COUNT(*)::int AS count FROM team_links WHERE team_id = $1',
    [teamId],
  );
  return result.rows[0].count;
};

export const deleteTeam = async (teamId: string, workspaceId: string) => {
  const result = await dbPool.query(
    'DELETE FROM teams WHERE id = $1 AND workspace_id = $2',
    [teamId, workspaceId],
  );
  return result.rowCount;
};
