import z from 'zod';

export const CreateProjectMilestonesParamsSchema = z.object({
  projectId: z.uuid('Invalid project UUID'),
});

export const UpdateProjectMilestonesParamsSchema = z.object({
  projectId: z.uuid('Invalid project UUID'),
  milestoneId: z.uuid('Invalid milestone UUID'),
});

export const DeleteProjectMilestonesParamsSchema =
  UpdateProjectMilestonesParamsSchema;

export const CreateProjectMilestonesBodySchema = z.object({
  name: z
    .string('Invalid name')
    .min(1, 'Name is required')
    .max(80, 'Name can not be longer than 80 characters'),
  description: z.string('Invalid description').optional(),
  targetDate: z.iso.date().optional(),
});

export const UpdateProjectMilestonesBodySchema = z
  .object({
    name: z
      .string('Invalid name')
      .min(1, 'Name is required')
      .max(80, 'Name can not be longer than 80 characters')
      .optional(),
    description: z.string('Invalid description').nullable().optional(),
    targetDate: z.iso.date().nullable().optional(),
  })
  .refine((data) => Object.values(data).length > 0, {
    error: 'At least one field is required to update',
  });
