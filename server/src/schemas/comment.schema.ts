import z from 'zod';

export const CommentParamSchema = z.object({
  taskId: z.uuid('Invalid task UUID'),
});

export const UpdateCommentParamSchema = CommentParamSchema.extend({
  commentId: z.uuid('Invalid comment UUID'),
});

export const CreateCommentSchema = z.object({
  body: z.object({
    content: z.string('Comment content is required'),
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
});

export const UpdateCommentSchema = CreateCommentSchema;

export const ProjectCommentParamSchema = z.object({
  projectId: z.uuid('Invalid project UUID'),
});

export const UpdateProjectCommentParamSchema = ProjectCommentParamSchema.extend(
  {
    commentId: z.uuid('Invalid comment UUID'),
  },
);
