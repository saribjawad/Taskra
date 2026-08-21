import z, { ZodUUID } from 'zod';

// Resusable Schema
const Status = z.enum(
  ['backlog', 'todo', 'in_progress', 'done', 'cancelled'],
  'Invalid status',
);
const Label = z.enum(['bug', 'feature', 'improvement'], 'Invalid label');
const Filter = z.enum(['assigned', 'created', 'all']);
const Priority = z.enum(
  ['urgent', 'high', 'medium', 'low', 'no_priority'],
  'Invalid priority',
);

export type FilterType = z.infer<typeof Filter>;
export type StatusType = z.infer<typeof Status>;
export type Priority = z.infer<typeof Priority>;
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

export const CreateTaskSchema = z
  .object({
    body: z.object({
      title: z
        .string('Invalid title')
        .min(1, 'Title is required')
        .max(250, 'Title cannot be more than 250 words'),
      description: z.string('Invalid description'),
      status: Status,
      priority: Priority,
      label: Label,
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
      status: Status.optional(),
      priority: Priority.optional(),
      label: Label.optional(),
      assignee: z.uuid('Invalid assignee UUID').optional(),
      reporter: z.uuid('Invalid reporter UUID').optional(),
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
