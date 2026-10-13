import z from 'zod';

export const CreateConversationBodySchema = z.object({
  participants: z
    .array(z.string())
    .min(1, 'Participants are required')
    .max(1, 'Only participant is allowed'),
});

export const GetUsersConversationQuerySchema = z
  .object({
    cursorId: z.uuid().optional(),
    cursorTime: z.iso.datetime().optional(),
  })
  .refine((q) => (q.cursorId === undefined) === (q.cursorTime === undefined), {
    message: 'cursorId and cursorTime must be provided together',
  });
