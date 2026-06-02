import z from 'zod';

export const CommentParamSchema = z.object({
  taskId: z.uuid('Invalid task UUID'),
});

export const CreateCommentSchema = z.object({
  content: z.string('Comment content is required'),
});
