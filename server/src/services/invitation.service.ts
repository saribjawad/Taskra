import { dbPool } from '../db';
import { Invitation, InvitationStatus } from '../models/invitation.model';
import { WorkspaceMemberRole } from '../models/workspace.model';

export async function createInvitation(
  email: string,
  role: WorkspaceMemberRole,
  sentBy: string,
  workspaceId: string,
  token: string,
  expiresAt: Date,
): Promise<Invitation> {
  const result = await dbPool.query(
    `
    INSERT INTO invitations (email, role, sent_by, workspace_id, token, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [email, role, sentBy, workspaceId, token, expiresAt],
  );

  return result.rows[0];
}

export async function deleteInvitation(id: string): Promise<void> {
  await dbPool.query(
    `DELETE FROM invitations
    WHERE id = $1`,
    [id],
  );
}

export async function getInvitationById(id: string) {
  const result = await dbPool.query(
    `SELECT * FROM invitations
    WHERE id = $1`,
    [id],
  );

  return result.rows[0];
}

export async function getInvitationByHash(
  hashedToken: string,
): Promise<Invitation> {
  const result = await dbPool.query(
    `SELECT * FROM invitations
    WHERE token = $1`,
    [hashedToken],
  );

  return result.rows[0];
}

export async function getInvitationDetailByHash(hashedToken: string) {
  const results = await dbPool.query(
    `
    SELECT
      i.id,
      i.status,
      i.email,
      i.role,
      i.expires_at,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email
      ) AS sentBy,
      json_build_object(
        'id', w.id,
        'name', w.name
      ) AS workspace
    FROM invitations i
    INNER JOIN users u
      ON u.id = i.sent_by
    INNER JOIN workspace w
      ON w.id = i.workspace_id
    WHERE i.token = $1;
    `,
    [hashedToken],
  );

  return results.rows[0];
}

export async function updateInvitationStatus(
  id: string,
  status: InvitationStatus,
) {
  const result = await dbPool.query(
    `UPDATE invitations
    SET status = $2
    WHERE id = $1`,
    [id, status],
  );

  return result.rowCount;
}

export async function getPendingInvitationByEmail(
  email: string,
  workspaceId: string,
) {
  const result = await dbPool.query(
    `
    SELECT * FROM invitations
    WHERE status = 'pending' AND email = $1 AND workspace_id = $2
    `,
    [email, workspaceId],
  );

  return result.rows[0];
}

export async function getPendingInvitations(workspaceId: string) {
  const result = await dbPool.query(
    `
    SELECT id, sent_by, status, email, role, created_at, expires_at FROM invitations
    WHERE status = 'pending' AND workspace_id = $1
    `,
    [workspaceId],
  );

  return result.rows;
}

export async function getWorkspaceInvitations(
  workspaceId: string,
): Promise<Invitation[]> {
  const result = await dbPool.query(
    `
    SELECT * FROM invitations
    WHERE workspace_id = $1
    `,
    [workspaceId],
  );

  return result.rows;
}
