import { dbPool } from '../db';
import { TeamDocument, TeamLink } from '../models/teamResources.model';

export const getTeamDocuments = async (
  teamId: string,
): Promise<TeamDocument[]> => {
  const results = await dbPool.query(
    `SELECT * FROM team_documents WHERE team_id = $1 ORDER BY created_at ASC, id ASC`,
    [teamId],
  );

  return results.rows;
};

export const getTeamDocument = async (
  documentId: string,
  teamId: string,
): Promise<TeamDocument> => {
  const results = await dbPool.query(
    `SELECT * FROM team_documents WHERE id = $1 AND team_id = $2`,
    [documentId, teamId],
  );

  return results.rows[0];
};

export const createTeamDocument = async (
  teamId: string,
  name: string,
  content?: string,
): Promise<TeamDocument> => {
  const results = await dbPool.query(
    `INSERT INTO team_documents (team_id, name, content) VALUES ($1, $2, $3) RETURNING *`,
    [teamId, name, content ?? null],
  );

  return results.rows[0];
};

export const updateTeamDocument = async (
  documentId: string,
  teamId: string,
  fields: { name?: string; content?: string | null },
) => {
  const entries = Object.entries(fields).filter(
    ([, value]) => value !== undefined,
  );
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`);

  const results = await dbPool.query(
    `UPDATE team_documents SET ${assignments.join(', ')} WHERE id = $${values.length + 1} AND team_id = $${values.length + 2}`,
    [...values, documentId, teamId],
  );

  return results.rowCount;
};

export const deleteTeamDocument = async (
  documentId: string,
  teamId: string,
) => {
  const results = await dbPool.query(
    `DELETE FROM team_documents WHERE id = $1 AND team_id = $2`,
    [documentId, teamId],
  );

  return results.rowCount;
};

export const getTeamLinks = async (teamId: string): Promise<TeamLink[]> => {
  const results = await dbPool.query(
    `SELECT * FROM team_links WHERE team_id = $1 ORDER BY created_at ASC, id ASC`,
    [teamId],
  );

  return results.rows;
};

export const getTeamLink = async (
  linkId: string,
  teamId: string,
): Promise<TeamLink> => {
  const results = await dbPool.query(
    `SELECT * FROM team_links WHERE id = $1 AND team_id = $2`,
    [linkId, teamId],
  );

  return results.rows[0];
};

export const createTeamLink = async (
  teamId: string,
  title: string,
  url: string,
): Promise<TeamLink> => {
  const results = await dbPool.query(
    `INSERT INTO team_links (team_id, title, url) VALUES ($1, $2, $3) RETURNING *`,
    [teamId, title, url],
  );

  return results.rows[0];
};

export const updateTeamLink = async (
  linkId: string,
  teamId: string,
  fields: { title?: string; url?: string },
) => {
  const entries = Object.entries(fields).filter(
    ([, value]) => value !== undefined,
  );
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`);

  const results = await dbPool.query(
    `UPDATE team_links SET ${assignments.join(', ')} WHERE id = $${values.length + 1} AND team_id = $${values.length + 2}`,
    [...values, linkId, teamId],
  );

  return results.rowCount;
};

export const deleteTeamLink = async (linkId: string, teamId: string) => {
  const results = await dbPool.query(
    `DELETE FROM team_links WHERE id = $1 AND team_id = $2`,
    [linkId, teamId],
  );

  return results.rowCount;
};
