import z from 'zod';

export const CreateConversationBodySchema = z.object({
  participants: z
    .array(z.string())
    .min(1, 'Participants are required')
    .max(1, 'Only participant is allowed'),
});
