import type { WorkspaceMemberRole } from '../models/workspace.model';
import { getTeamMember } from '../services/teamMembers.service';
import { ApiError } from './ApiErrors';

export async function requireTeamWriteAccess(
  userId: string,
  role: WorkspaceMemberRole | null,
  teamId: string,
) {
  if (role === 'owner' || role === 'admin') return;

  const membership = await getTeamMember(userId, teamId);
  if (!membership) {
    throw ApiError.forbidden(
      'You must be a member of this team to create tasks or projects in it',
    );
  }
}
