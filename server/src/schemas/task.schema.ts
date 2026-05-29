import z from 'zod';

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
});

export const CreateTaskSchema = z.object({
  title: z
    .string('Invalid title')
    .min(1, 'Title is required')
    .max(250, 'Title cannot be more than 250 words'),
  description: z.string('Invalid description'),
  status: z.enum(['backlog', 'todo', 'in_progress', 'done', 'cancelled']),
  priority: z.enum(['urgent', 'high', 'medium', 'low', 'no_priority']),
  label: z.enum(['bug', 'feature', 'improvement']),
  assignee: z.uuid('Invalid assignee'),
});

export const UpdateTaskSchema = z.object({
  title: z
    .string('Invalid title')
    .max(250, 'Title cannot be more than 250 words'),
  description: z.string('Invalid description'),
  status: z.enum(['backlog', 'todo', 'in_progress', 'done', 'cancelled']),
  priority: z.enum(['urgent', 'high', 'medium', 'low', 'no_priority']),
  label: z.enum(['bug', 'feature', 'improvement']),
  assignee: z.uuid('Invalid assignee'),
});
export type UpdateSchema = z.infer<typeof UpdateTaskSchema>;
