import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  SendMessageBodySchema,
  SendMessageParamSchema,
} from '../schemas/messages.schema';
import {
  addLastMessageOnConversation,
  getConversationByIdAndWorkspaceId,
} from '../services/conversations.service';
import { ApiError } from '../utils/ApiErrors';
import { getConversationParticipantByUserId } from '../services/conversationParticipants.service';
import { createMessage } from '../services/mesages.service';

export const SendMessage = async (req: Request, res: Response) => {
  const user = req.user;
  const { conversationId } = SendMessageParamSchema.parse(req.params);
  const { content } = SendMessageBodySchema.parse(req.body);

  // Check if conversation exists and belongs to the active workspace
  const conversation = await getConversationByIdAndWorkspaceId(
    conversationId,
    user.activeWorkspace,
  );

  if (!conversation) {
    throw ApiError.notFound('Conversation not found');
  }

  // Check if the user is participant of this conversation
  const conversationParticipant = await getConversationParticipantByUserId(
    user.id,
  );

  if (!conversationParticipant) {
    throw ApiError.notFound('Conversation participant not found');
  }

  if (conversationParticipant.conversation_id !== conversation.id) {
    throw ApiError.forbidden('User is not participant of the conversation');
  }

  const createdMessage = await createMessage(
    conversation.id,
    user.id,
    conversationParticipant.id,
    content,
  );

  if (!createdMessage) {
    throw ApiError.internal('Something went wrong while creating the message');
  }

  const updatedRowsCount = await addLastMessageOnConversation(
    conversation.id,
    createdMessage.id,
    createdMessage.created_at,
  );

  if (!updatedRowsCount || updatedRowsCount <= 0) {
    throw ApiError.internal(
      'Something went wrong while adding message on conversation',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Message sent', createdMessage));
};
