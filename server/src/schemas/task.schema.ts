import z from 'zod';
import { Priority } from './common.schema';

// Reusable field schemas
export const TaskStatus = z.enum(
  ['backlog', 'todo', 'in_progress', 'done', 'cancelled'],
  'Invalid status',
);
export const TaskLabel = z.enum(
  ['bug', 'feature', 'improvement'],
  'Invalid label',
);
export const TaskFilter = z.enum(['assigned', 'created', 'all']);
const ClearableTaskField = z.enum(['assignee', 'reporter']);

// Schemas
export const TaskParamsSchema = z.object({
  taskId: z.uuid('Invalid task UUID'),
});
export const MarkTaskAsCompletedParamsSchema = TaskParamsSchema;
export const GetTaskActivityParamsSchema = TaskParamsSchema;
export const ConnectTaskToProjectParamsSchema = TaskParamsSchema;

export const GetTaskQuerySchema = z.object({
  page: z.coerce
    .number('Invalid number')
    .positive('Should be a positive number.'),
  limit: z.coerce
    .number('Invalid number')
    .positive('Should be a positive number'),
  filter: TaskFilter.optional().default('all'),
  status: TaskStatus.optional(),
  priority: Priority.optional(),
  label: TaskLabel.optional(),
  search: z.string('Invalid search').optional(),
});

export const GetTaskActivityQuerySchema = z
  .object({
    cursorId: z.uuid().optional(),
    cursorTime: z.iso.datetime().optional(),
  })
  .refine((q) => (q.cursorId === undefined) === (q.cursorTime === undefined), {
    message: 'cursorId and cursorTime must be provided together',
  });

export const CreateTaskSchema = z
  .object({
    body: z.object({
      title: z
        .string('Invalid title')
        .min(1, 'Title is required')
        .max(250, 'Title cannot be more than 250 words'),
      teamId: z.uuid('Invalid team UUID'),
      description: z.string('Invalid description'),
      status: TaskStatus,
      priority: Priority,
      label: TaskLabel,
      startDate: z.coerce.date('Invalid start date').optional(),
      dueDate: z.coerce.date('Invalid due date').optional(),
      assignee: z.uuid('Invalid assignee UUID').optional(),
      reporter: z.uuid('Invalid reporter UUID').optional(),
    }),
    files: z
      .object({
        images: z
          .array(
            z.object({
              mimetype: z
                .string()
                .refine(
                  (val) =>
                    ['image/jpeg', 'image/png', 'image/webp'].includes(val),
                  'Only JPEG, PNG, and WebP images are allowed',
                ),
              size: z
                .number()
                .max(5 * 1024 * 1024, 'File size must not exceed 5MB'),
            }),
          )
          .max(3, 'Cannot add more than 3 images')
          .optional(),
        pdf: z
          .array(
            z.object({
              mimetype: z
                .string()
                .refine(
                  (val) => ['application/pdf'].includes(val),
                  'Only PDF are allowed as PDF',
                ),
              size: z
                .number()
                .max(5 * 1024 * 1024, 'PDF size must not exceed 5MB'),
            }),
          )
          .max(1, 'Cannot add more than one PDF')
          .optional(),
        document: z
          .array(
            z.object({
              mimetype: z
                .string()
                .refine(
                  (val) =>
                    [
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    ].includes(val),
                  'Only DOCX are allowed as documents',
                ),
              size: z
                .number()
                .max(5 * 1024 * 1024, 'Document size must not exceed 5MB'),
            }),
          )
          .max(1, 'Cannot add more than one Document')
          .optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const body = data.body;
    // Throw error if due date is before then start date
    if (body.dueDate && body.startDate && body.dueDate <= body.startDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'Due date cannot be before the start date.',
        path: ['dueDate'],
      });
    }
  });

export const UpdateTaskSchema = z
  .object({
    body: z.object({
      title: z
        .string('Invalid title')
        .max(250, 'Title cannot be more than 250 words')
        .optional(),
      description: z.string('Invalid description').optional(),
      status: TaskStatus.optional(),
      priority: Priority.optional(),
      label: TaskLabel.optional(),
      assignee: z.uuid('Invalid assignee UUID').optional(),
      reporter: z.uuid('Invalid reporter UUID').optional(),
      clearFields: z
        .preprocess(
          (value) =>
            value === undefined ? [] : Array.isArray(value) ? value : [value],
          z.array(ClearableTaskField),
        )
        .optional()
        .default([]),
      startDate: z.coerce.date('Invalid start date').optional(),
      dueDate: z.coerce.date('Invalid due date').optional(),
      removedAttachmentIds: z.array(z.string()).optional().default([]),
    }),
    files: z
      .object({
        images: z
          .array(
            z.object({
              mimetype: z
                .string()
                .refine(
                  (val) =>
                    ['image/jpeg', 'image/png', 'image/webp'].includes(val),
                  'Only JPEG, PNG, and WebP images are allowed',
                ),
              size: z
                .number()
                .max(5 * 1024 * 1024, 'File size must not exceed 5MB'),
            }),
          )
          .max(3, 'Cannot add more than 3 images')
          .optional(),
        pdf: z
          .array(
            z.object({
              mimetype: z
                .string()
                .refine(
                  (val) => ['application/pdf'].includes(val),
                  'Only PDF are allowed as PDF',
                ),
              size: z
                .number()
                .max(5 * 1024 * 1024, 'PDF size must not exceed 5MB'),
            }),
          )
          .max(1, 'Cannot add more than one PDF')
          .optional(),
        document: z
          .array(
            z.object({
              mimetype: z
                .string()
                .refine(
                  (val) =>
                    [
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    ].includes(val),
                  'Only DOCX are allowed as documents',
                ),
              size: z
                .number()
                .max(5 * 1024 * 1024, 'Document size must not exceed 5MB'),
            }),
          )
          .max(1, 'Cannot add more than one Document')
          .optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const body = data.body;
    // Throw error if due date is before then start date
    if (body.dueDate && body.startDate && body.dueDate <= body.startDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'Due date cannot be before the start date.',
        path: ['dueDate'],
      });
    }
  });

export type UpdateSchema = z.infer<typeof UpdateTaskSchema>;

export const ConnectTaskToProjectBodySchema = z
  .object({
    projectId: z.uuid('Invalid project UUID').nullable(),
    milestoneId: z.uuid('Invalid milestone UUID').optional(),
  })
  .refine((data) => data.projectId !== null || !data.milestoneId, {
    message: 'A milestone requires a project',
    path: ['milestoneId'],
  });
