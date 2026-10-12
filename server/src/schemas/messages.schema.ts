import z from 'zod';

export const SendMessageParamSchema = z.object({
  conversationId: z.uuid('Invalid conversation UUID'),
});

export const SendMessageBodySchema = z.object({
  content: z.string().min(1, 'Message is content is required'),
});
