import z from 'zod';
import { Priority } from './common.schema';
import { TaskLabel, TaskStatus } from './task.schema';

export const SubTaskParamsSchema = z.object({
  taskId: z.uuid('Invalid task UUID'),
});
export const SubTaskItemParamsSchema = SubTaskParamsSchema.extend({
  subTaskId: z.uuid('Invalid subtask UUID'),
});
export const SubTaskAttachmentParamsSchema = SubTaskItemParamsSchema.extend({
  attachmentId: z.uuid('Invalid attachment UUID'),
});
const ClearableSubTaskField = z.enum(['assignee']);

const SubTaskBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(250, 'Title cannot exceed 250 characters'),
  description: z
    .preprocess((value) => (value === '' ? null : value), z.string().nullable())
    .optional(),
  status: TaskStatus.optional(),
  priority: Priority.optional(),
  label: TaskLabel.optional(),
  assignee: z.uuid('Invalid assignee UUID').optional(),
});

const SubTaskFilesSchema = z
  .object({
    images: z
      .array(
        z.object({
          mimetype: z
            .string()
            .refine(
              (value) =>
                ['image/jpeg', 'image/png', 'image/webp'].includes(value),
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
              (value) => value === 'application/pdf',
              'Only PDF files are allowed',
            ),
          size: z.number().max(5 * 1024 * 1024, 'PDF size must not exceed 5MB'),
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
              (value) =>
                value ===
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Only DOCX files are allowed',
            ),
          size: z
            .number()
            .max(5 * 1024 * 1024, 'Document size must not exceed 5MB'),
        }),
      )
      .max(1, 'Cannot add more than one document')
      .optional(),
  })
  .optional();

export const CreateSubTaskSchema = z.object({
  body: SubTaskBodySchema,
  files: SubTaskFilesSchema,
});

const UpdateSubTaskBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(250, 'Title cannot exceed 250 characters')
    .optional(),
  description: z
    .preprocess((value) => (value === '' ? null : value), z.string().nullable())
    .optional(),
  status: TaskStatus.optional(),
  priority: Priority.optional(),
  label: z
    .preprocess((value) => (value === '' ? null : value), TaskLabel.nullable())
    .optional(),
  assignee: z.uuid('Invalid assignee UUID').optional(),
  clearFields: z
    .preprocess(
      (value) =>
        value === undefined ? [] : Array.isArray(value) ? value : [value],
      z.array(ClearableSubTaskField),
    )
    .optional()
    .default([]),
  removedAttachmentIds: z.array(z.string()).optional().default([]),
});

export const UpdateSubTaskSchema = z
  .object({
    body: UpdateSubTaskBodySchema,
    files: SubTaskFilesSchema,
  })
  .superRefine(({ body, files }, ctx) => {
    const hasFiles = Object.values(files ?? {}).some(
      (fieldFiles) => fieldFiles && fieldFiles.length > 0,
    );

    const hasFields = Object.entries(body).some(
      ([key, value]) =>
        key !== 'clearFields' &&
        key !== 'removedAttachmentIds' &&
        value !== undefined,
    );

    const hasRemovals =
      body.clearFields.length > 0 || body.removedAttachmentIds.length > 0;

    if (!hasFields && !hasRemovals && !hasFiles) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one field or attachment is required to update',
        path: ['body'],
      });
    }
  });
