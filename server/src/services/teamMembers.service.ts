import { PoolClient } from 'pg';
import { dbPool } from '../db';
import { TeamMemberWithUserDetails } from '../models/teamMembers.model';

export const createTeamMember = async (
  payload: {
    userId: string;
    teamId: string;
  },
  txClient?: PoolClient,
) => {
  const { teamId, userId } = payload;

  const db = txClient || dbPool;
  const results = await db.query(
    `
      INSERT INTO team_members (user_id, team_id)
      VALUES ($1, $2)
      RETURNING*
    `,
    [userId, teamId],
  );

  return results.rows[0];
};

export const getTeamMembers = async (
  teamId: string,
): Promise<TeamMemberWithUserDetails[]> => {
  const results = await dbPool.query(
    `
      SELECT tm.id, tm.team_id, tm.user_id, tm.created_at,
        u.username, u.full_name, u.email
      FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = $1
      ORDER BY tm.created_at ASC, tm.id ASC
    `,
    [teamId],
  );

  return results.rows;
};

export const getTeamMembersByUserIds = async (
  userIds: string[],
  teamId: string,
) => {
  const existing = await dbPool.query(
    'SELECT user_id FROM team_members WHERE team_id = $1 AND user_id = ANY($2::uuid[])',
    [teamId, userIds],
  );
  return existing.rows;
};

export const createTeamMembers = async (userIds: string[], teamId: string) => {
  const result = await dbPool.query(
    `
    INSERT INTO team_members (user_id, team_id)
    SELECT user_id, $2
    FROM unnest($1::uuid[]) AS user_id
    RETURNING user_id
    `,
    [userIds, teamId],
  );
  return result.rows;
};

export const getTeamMember = async (userId: string, teamId: string) => {
  const members = await dbPool.query(
    'SELECT user_id FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId],
  );
  return members.rows[0];
};

export const getTeamMembersCount = async (teamId: string): Promise<number> => {
  const result = await dbPool.query(
    'SELECT COUNT(*)::int AS count FROM team_members WHERE team_id = $1',
    [teamId],
  );
  return result.rows[0].count;
};

export const deleteTeamMember = async (userId: string, teamId: string) => {
  const removed = await dbPool.query(
    'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING user_id',
    [teamId, userId],
  );
  return removed.rowCount;
};
