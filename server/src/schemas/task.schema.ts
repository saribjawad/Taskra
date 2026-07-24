import z from 'zod';

// Resusable types

const Status = z.enum(
  ['backlog', 'todo', 'in_progress', 'done', 'cancelled'],
  'Invalid status',
);
export type StatusType = z.infer<typeof Status>;

const Filter = z.enum(['assigned', 'created', 'all']);
export type FilterType = z.infer<typeof Filter>;

const Priority = z.enum(
  ['urgent', 'high', 'medium', 'low', 'no_priority'],
  'Invalid priority',
);
export type Priority = z.infer<typeof Priority>;

const Label = z.enum(['bug', 'feature', 'improvement'], 'Invalid label');
export type LabelType = z.infer<typeof Label>;

// Schemas

export const TaskParamsSchema = z.object({
  taskId: z.uuid('Invalid task UUID'),
});

export const GetTaskQuerySchema = z.object({
  page: z.coerce
    .number('Invalid number')
    .positive('Should be a positive number.'),
  limit: z.coerce
    .number('Invalid number')
    .positive('Should be a positive number'),
  filter: Filter.optional().default('all'),
  status: Status.optional(),
  priority: Priority.optional(),
  label: Label.optional(),
  search: z.string('Invalid search').optional(),
});

export const CreateTaskSchema = z.object({
  title: z
    .string('Invalid title')
    .min(1, 'Title is required')
    .max(250, 'Title cannot be more than 250 words'),
  description: z.string('Invalid description'),
  status: Status,
  priority: Priority,
  label: Label,
  assignee: z.uuid('Invalid assignee').optional(),
});

export const UpdateTaskSchema = z.object({
  title: z
    .string('Invalid title')
    .max(250, 'Title cannot be more than 250 words')
    .optional(),
  description: z.string('Invalid description').optional(),
  status: Status.optional(),
  priority: Priority.optional(),
  label: Label.optional(),
  assignee: z.uuid('Invalid assignee').optional(),
});
export type UpdateSchema = z.infer<typeof UpdateTaskSchema>;
