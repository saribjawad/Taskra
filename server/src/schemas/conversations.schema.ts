import z from 'zod';

export const GetConversationMessagesParamSchema = z.object({
  conversationId: z.uuid(),
});

export const GetConversationMessagesQuerySchema = z
  .object({
    cursorId: z.uuid().optional(),
    cursorTime: z.iso.datetime().optional(),
  })
  .refine((q) => (q.cursorId === undefined) === (q.cursorTime === undefined), {
    message: 'cursorId and cursorTime must be provided together',
  });

export const CreateConversationBodySchema = z
  .object({
    participants: z.array(z.string()).min(1, 'Participants are required'),
    title: z
      .string('Invalid title, required string')
      .max(25, 'Title cannot be more then 25 letters')
      .optional(),
    isGroup: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.isGroup) {
        return Boolean(data.title && data.title.trim().length > 0);
      }
      return true;
    },
    {
      error: 'Title is required for groups',
      path: ['title'],
    },
  )
  .refine(
    (data) => {
      if (!data.isGroup) {
        return data.participants.length === 1;
      }
      return true;
    },
    {
      path: ['participants'],
      error: 'Only one participant is required, for non group conversations',
    },
  );

export const GetUsersConversationQuerySchema = z
  .object({
    cursorId: z.uuid().optional(),
    cursorTime: z.iso.datetime().optional(),
  })
  .refine((q) => (q.cursorId === undefined) === (q.cursorTime === undefined), {
    message: 'cursorId and cursorTime must be provided together',
  });
