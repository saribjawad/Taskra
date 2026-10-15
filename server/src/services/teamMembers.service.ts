import { dbPool } from '../db';

export const createTeamMember = async (userId: string, teamId: string) => {
  const results = await dbPool.query(
    `
      INSERT INTO team_members (user_id, team_id)
      VALUES ($1, $2)
      RETURNING*
    `,
    [userId, teamId],
  );

  return results.rows[0];
};
