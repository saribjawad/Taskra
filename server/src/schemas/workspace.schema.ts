import z from 'zod';

export const WorkspaceIdParamsSchema = z.object({
  workspaceId: z.uuid('Invalid uuid'),
});

export const CreateWorkspaceSchema = z.object({
  name: z
    .string('Name can only be string')
    .max(250, 'Name cannot be more than 250 characters'),
});
