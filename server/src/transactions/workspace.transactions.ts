import { executeTranscation } from '../db/transaction';
import { Invitation } from '../models/invitation.model';
import { WorkspaceMemberRole } from '../models/workspace.model';
import { updateInvitationStatus } from '../services/invitation.service';
import { createNotification } from '../services/notifications.service';
import { createTeamMember } from '../services/teamMembers.service';
import { createTeam } from '../services/teams.service';
import { updateUser } from '../services/user.service';
import {
  createWorkspace,
  createWorkspaceMember,
} from '../services/workspace.service';

interface CreateWorkspaceWorkflowInput {
  user: {
    id: string;
    fullName: string;
    email: string;
    activeWorkspace: string;
  };
  workspaceName: string;
}

export const createWorkspaceWorkflow = async (
  data: CreateWorkspaceWorkflowInput,
) => {
  const { workspaceName, user } = data;

  const results = await executeTranscation(async (txClient) => {
    // Create workspace
    const workspace = await createWorkspace(
      {
        name: workspaceName,
      },
      txClient,
    );

    // Update the user's active workspace
    await updateUser(
      {
        id: user.id,
        active_workspace: workspace.id,
      },
      txClient,
    );

    // Create the workspace member
    const workspaceMember = await createWorkspaceMember(
      {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'owner',
      },
      txClient,
    );

    // Create team and team member

    // Capatilize first letter
    const firstName = workspace.name.split(' ')[0];
    const capitalFirstLetter = firstName[0].toUpperCase();
    const teamName = capitalFirstLetter + firstName.slice(1);

    // Team identifier
    const identifier = teamName.slice(0, 3).toUpperCase();

    const createdTeam = await createTeam(
      {
        name: teamName,
        workspaceId: workspace.id,
        identifier,
      },
      txClient,
    );

    await createTeamMember(
      {
        userId: user.id,
        teamId: createdTeam.id,
      },
      txClient,
    );

    return { workspace, workspaceMember };
  });

  return results;
};

export const declineWorkspaceInviteFlow = async (data: {
  invitation: Invitation;
  user: {
    id: string;
    email: string;
    fullName: string;
    activeWorkspace: string;
  };
}) => {
  const { invitation, user } = data;

  const results = await executeTranscation(async (txClient) => {
    // Update the status to 'declined'
    await updateInvitationStatus(
      {
        id: invitation.id,
        status: 'declined',
      },
      txClient,
    );
    // Notify sender
    if (invitation.sent_by) {
      await createNotification(
        {
          userId: invitation.sent_by,
          workspaceId: invitation.workspace_id,
          type: 'invite:declined',
          message: `The invite you sent to ${user.email} has been declined`,
          metaData: {
            actorId: user.id,
          },
        },
        txClient,
      );
    }
  });

  return results;
};

export const acceptWorkspaceInviteFlow = async (data: {
  invitation: Invitation;
  user: { id: string; email: string };
}) => {
  const { invitation, user } = data;

  return executeTranscation(async (txClient) => {
    const member = await createWorkspaceMember(
      {
        userId: user.id,
        workspaceId: invitation.workspace_id,
        role: invitation.role,
      },
      txClient,
    );

    await updateInvitationStatus(
      {
        id: invitation.id,
        status: 'accepted',
      },
      txClient,
    );

    await updateUser(
      {
        id: user.id,
        active_workspace: member.workspace_id,
      },
      txClient,
    );

    if (invitation.sent_by) {
      await createNotification(
        {
          userId: invitation.sent_by,
          workspaceId: invitation.workspace_id,
          type: 'invite:accepted',
          message: `The invite you sent to ${user.email} has been accepted`,
          metaData: {
            actorId: user.id,
          },
        },
        txClient,
      );
    }

    return member;
  });
};
