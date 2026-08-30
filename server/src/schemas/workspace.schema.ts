import z from 'zod';

export const WorkspaceIdParamsSchema = z.object({
  workspaceId: z.uuid('Invalid uuid'),
});
export const GetPendingWorkspaceInvitesSchema = WorkspaceIdParamsSchema;

export const CreateWorkspaceSchema = z.object({
  name: z
    .string('Name can only be string')
    .min(1, 'Name is requried')
    .max(250, 'Name cannot be more than 250 characters'),
});

export const RemoveMemberFromWorkspaceSchema = z.object({
  memberId: z.uuid('Invalid member uuid'),
  workspaceId: z.uuid('Invalid workspace uuid'),
});

export const InviteToWorkspaceParamsSchema = WorkspaceIdParamsSchema;
export const InviteToWorkspaceSchema = z.object({
  emails: z.array(z.email('Invalid email'), 'Required array of emails'),
  role: z.enum(['member', 'admin', 'viewer', 'owner']),
});

export const VerifyWorkspaceInvitationParamsSchema = z.object({
  token: z.string().regex(/^[0-9a-fA-F]{64}$/, {
    message: 'Token must be a 64-character hex string (32 bytes)',
  }),
});

export const AcceptWorkspaceInviteParamsSchema =
  VerifyWorkspaceInvitationParamsSchema;

export const DeclineWorkspaceInviteParamsSchema =
  VerifyWorkspaceInvitationParamsSchema;
export const RevokeWorkspaceInviteParamsSchema =
  VerifyWorkspaceInvitationParamsSchema;

export const GetWorkspaceInvitesParamsSchema = WorkspaceIdParamsSchema;
export const GetWorkspaceUsersParamsSchema = WorkspaceIdParamsSchema;
