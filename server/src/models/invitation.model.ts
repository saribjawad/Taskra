import { WorkspaceMemberRole } from './workspace.model';

export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'revoked'
  | 'expired';

export type Invitation = {
  id: string;
  sent_by: string;
  status: InvitationStatus;
  email: string;
  role: WorkspaceMemberRole;
  workspace_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
};
