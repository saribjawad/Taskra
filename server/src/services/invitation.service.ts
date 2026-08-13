import { dbPool } from '../db';
import { Invitation, InvitationStatus, Role } from '../models/invitation.model';

export async function createInvitation(
  email: string,
  role: Role,
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

export async function getPendingInvitation(email: string, workspaceId: string) {
  const result = await dbPool.query(
    `
    SELECT * FROM invitations
    WHERE status = 'pending' & email = $1 & workspace_id = $2
    `,
    [email, workspaceId],
  );

  return result.rows[0];
}
