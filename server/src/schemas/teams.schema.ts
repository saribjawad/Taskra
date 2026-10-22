import z from 'zod';
import { Priority } from './common.schema';
import { TaskLabel, TaskStatus } from './task.schema';

export const CreateTeamBodySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(24, 'Name cannot be more then 24 characters'),
  identifier: z
    .string()
    .min(3, 'Should be of minimum 3 characters')
    .max(6, 'Cannot be more than 6 characters')
    .transform((val) => val.toUpperCase()),
  description: z.string().optional(),
});

export const TeamIdParamsSchema = z.object({
  teamId: z.uuid('Invalid team UUID'),
});

export const TeamMemberParamsSchema = TeamIdParamsSchema.extend({
  memberId: z.uuid('Invalid member UUID'),
});

export const CreateTeamMemberBodySchema = z.object({
  memberIds: z.array(z.uuid('Invalid member UUID')).min(1),
});

export const GetTeamTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: TaskStatus.optional(),
  priority: Priority.optional(),
  label: TaskLabel.optional(),
  search: z.string().trim().optional(),
});

export const GetTeamProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
