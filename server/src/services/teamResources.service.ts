import { dbPool } from '../db';
import { TeamDocument, TeamLink } from '../models/teamResources.model';

export const getTeamDocuments = async (
  teamId: string,
): Promise<TeamDocument[]> => {
  const results = await dbPool.query(
    `
      SELECT team_documents.*, users.full_name AS created_by_full_name,
        users.username AS created_by_username
      FROM team_documents
      LEFT JOIN users ON users.id = team_documents.created_by
      WHERE team_documents.team_id = $1
      ORDER BY team_documents.created_at ASC, team_documents.id ASC
    `,
    [teamId],
  );

  return results.rows;
};

export const getTeamDocument = async (
  documentId: string,
  teamId: string,
): Promise<TeamDocument> => {
  const results = await dbPool.query(
    `
      SELECT team_documents.*, users.full_name AS created_by_full_name,
        users.username AS created_by_username
      FROM team_documents
      LEFT JOIN users ON users.id = team_documents.created_by
      WHERE team_documents.id = $1 AND team_documents.team_id = $2
    `,
    [documentId, teamId],
  );

  return results.rows[0];
};

export const createTeamDocument = async (
  teamId: string,
  name: string,
  content: string | undefined,
  createdBy: string,
): Promise<TeamDocument> => {
  const results = await dbPool.query(
    `INSERT INTO team_documents (team_id, name, content, created_by) VALUES ($1, $2, $3, $4) RETURNING *`,
    [teamId, name, content ?? null, createdBy],
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
    `
      SELECT team_links.*, users.full_name AS created_by_full_name,
        users.username AS created_by_username
      FROM team_links
      LEFT JOIN users ON users.id = team_links.created_by
      WHERE team_links.team_id = $1
      ORDER BY team_links.created_at ASC, team_links.id ASC
    `,
    [teamId],
  );

  return results.rows;
};

export const getTeamLink = async (
  linkId: string,
  teamId: string,
): Promise<TeamLink> => {
  const results = await dbPool.query(
    `
      SELECT team_links.*, users.full_name AS created_by_full_name,
        users.username AS created_by_username
      FROM team_links
      LEFT JOIN users ON users.id = team_links.created_by
      WHERE team_links.id = $1 AND team_links.team_id = $2
    `,
    [linkId, teamId],
  );

  return results.rows[0];
};

export const createTeamLink = async (
  teamId: string,
  title: string,
  url: string,
  createdBy: string,
): Promise<TeamLink> => {
  const results = await dbPool.query(
    `INSERT INTO team_links (team_id, title, url, created_by) VALUES ($1, $2, $3, $4) RETURNING *`,
    [teamId, title, url, createdBy],
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
