import z from 'zod';

const TeamIdParamsSchema = z.object({
  teamId: z.uuid('Invalid team UUID'),
});

export const GetTeamDocumentsParamsSchema = TeamIdParamsSchema;
export const CreateTeamDocumentParamsSchema = TeamIdParamsSchema;
export const GetTeamDocumentParamsSchema = TeamIdParamsSchema.extend({
  documentId: z.uuid('Invalid document UUID'),
});
export const UpdateTeamDocumentParamsSchema = GetTeamDocumentParamsSchema;
export const DeleteTeamDocumentParamsSchema = GetTeamDocumentParamsSchema;

export const CreateTeamDocumentBodySchema = z.object({
  name: z
    .string('Invalid document name')
    .trim()
    .min(1, 'Name is required')
    .max(24, 'Name cannot be longer than 24 characters'),
  content: z.string('Invalid document content').optional(),
});

export const UpdateTeamDocumentBodySchema = z
  .object({
    name: z
      .string('Invalid document name')
      .trim()
      .min(1, 'Name is required')
      .max(24, 'Name cannot be longer than 24 characters')
      .optional(),
    content: z.string('Invalid document content').nullable().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: 'At least one field is required to update',
  });

export const GetTeamLinksParamsSchema = TeamIdParamsSchema;
export const CreateTeamLinkParamsSchema = TeamIdParamsSchema;
export const GetTeamLinkParamsSchema = TeamIdParamsSchema.extend({
  linkId: z.uuid('Invalid link UUID'),
});
export const UpdateTeamLinkParamsSchema = GetTeamLinkParamsSchema;
export const DeleteTeamLinkParamsSchema = GetTeamLinkParamsSchema;

const TeamLinkFieldsSchema = {
  title: z
    .string('Invalid link title')
    .trim()
    .min(1, 'Title is required')
    .max(24, 'Title cannot be longer than 24 characters'),
  url: z.url('Invalid URL'),
};

export const CreateTeamLinkBodySchema = z.object(TeamLinkFieldsSchema);

export const UpdateTeamLinkBodySchema = z
  .object({
    title: TeamLinkFieldsSchema.title.optional(),
    url: TeamLinkFieldsSchema.url.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: 'At least one field is required to update',
  });
