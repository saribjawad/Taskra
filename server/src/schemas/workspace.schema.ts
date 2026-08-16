import z from 'zod';

export const WorkspaceIdParamsSchema = z.object({
  workspaceId: z.uuid('Invalid uuid'),
});

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
  email: z.email('Invalid email'),
});

export const AcceptWorkspaceInviteSchema = z.object({
  token: z.string().regex(/^[0-9a-fA-F]{64}$/, {
    message: 'Token must be a 64-character hex string (32 bytes)',
  }),
});

export const DeclineWorkspaceInviteSchema = AcceptWorkspaceInviteSchema;
export const RevokeWorkspaceInviteSchema = AcceptWorkspaceInviteSchema;

export const GetWorkspaceInvitesParamsSchema = WorkspaceIdParamsSchema;
export const GetWorkspaceUsersParamsSchema = WorkspaceIdParamsSchema;
