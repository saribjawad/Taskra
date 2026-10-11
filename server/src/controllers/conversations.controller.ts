import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  createConversation,
  getExistingConversationByParticipants,
} from '../services/conversations.service';
import { ApiError } from '../utils/ApiErrors';
import { CreateConversationBodySchema } from '../schemas/conversations.schema';
import { createConversationParticipant } from '../services/conversationParticipants.service';
import { getWorkspaceMembers } from '../services/workspace.service';

export const CreateConversation = async (req: Request, res: Response) => {
  const user = req.user;
  const { participants } = CreateConversationBodySchema.parse(req.body);
  const uniqueParticipants = new Set([...participants, user.id]);

  // Check if participants are part of workspace
  const members = await getWorkspaceMembers(participants, user.activeWorkspace);

  if (members.length !== participants.length) {
    throw ApiError.forbidden(
      'One of the participants is not part of the workspace',
    );
  }

  // Check if conversation already exists with matching participants
  const conversationsParticipants = await getExistingConversationByParticipants(
    [...participants, user.id],
  );

  if (conversationsParticipants) {
    throw ApiError.forbidden('Conversation already exists');
  }

  // Create conversation
  const conversations = await createConversation(user.activeWorkspace);

  if (!conversations) {
    throw ApiError.internal(
      'Something went wrong while creating the conversation',
    );
  }

  // Create conversation user -> connected to conversation
  await Promise.all([
    uniqueParticipants.forEach(async (p) => {
      const createdConversationUser = await createConversationParticipant(
        p,
        conversations.id,
      );

      if (!createdConversationUser) {
        throw ApiError.internal(
          'Something went wrong while creating conversation user',
        );
      }
    }),
  ]);

  res.status(200).json(new ApiResponse(200, 'Conversation created'));
};
