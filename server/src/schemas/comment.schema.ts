import z from 'zod';

export const CommentParamSchema = z.object({
  taskId: z.uuid('Invalid task UUID'),
});

export const UpdateCommentParamSchema = CommentParamSchema.extend({
  commentId: z.uuid('Invalid comment UUID'),
});

export const CreateCommentSchema = z.object({
  content: z.string('Comment content is required'),
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
