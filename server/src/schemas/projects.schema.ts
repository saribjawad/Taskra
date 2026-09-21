import z from 'zod';
import { Priority } from './common.schema';

// Reusable field schemas
export const ProjectStatus = z.enum(
  ['backlog', 'planned', 'in_progress', 'completed', 'cancelled'],
  'Invalid project status',
);

// Schema
export const CreateProjectSchema = z.object({
  name: z
    .string('Invalid Name')
    .min(1, 'Name is required')
    .max(80, 'Name can not be longer than 80 characters.'),
  shortSummary: z
    .string('Invalid short summary')
    .max(255, 'Summary can not be longer than 255 characters.')
    .optional(),
  description: z.string('Invalid description').optional(),
  priority: Priority,
  status: ProjectStatus,
  leadId: z.uuid('Invalid lead UUID').optional(),
  startDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
});
