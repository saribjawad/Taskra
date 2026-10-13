import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  createConversation,
  getConversationByIdAndWorkspaceId,
  getConversationMessages,
  getConversationParticipantsExceptUser,
  getExistingConversationByParticipants,
  getUsersConversations,
} from '../services/conversations.service';
import { ApiError } from '../utils/ApiErrors';
import {
  CreateConversationBodySchema,
  GetConversationMessagesParamSchema,
  GetConversationMessagesQuerySchema,
  GetUsersConversationQuerySchema,
} from '../schemas/conversations.schema';
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
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          'Conversation created',
          conversationsParticipants.conversation_id,
        ),
      );
  }

  // Create conversation
  const conversations = await createConversation(user.activeWorkspace);

  if (!conversations) {
    throw ApiError.internal(
      'Something went wrong while creating the conversation',
    );
  }

  // Create conversation user -> connected to conversation
  await Promise.all(
    [...uniqueParticipants].map(async (p) => {
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
  );

  res
    .status(200)
    .json(new ApiResponse(200, 'Conversation created', conversations.id));
};

export const GetUsersConversations = async (req: Request, res: Response) => {
  const user = req.user;
  const LIMIT = 1;
  const { cursorId, cursorTime } = GetUsersConversationQuerySchema.parse(
    req.query,
  );

  const userConversations = await getUsersConversations(
    user.id,
    // LIMIT + 1, to check if there is next page
    LIMIT + 1,
    cursorId,
    cursorTime,
  );

  // If there are no user conversations, just return a response
  if (userConversations.length < 1) {
    return res.status(200).json(new ApiResponse(200, "User's conversations"));
  }

  const hasNextPage = userConversations.length > LIMIT;
  const pageUserConversations = userConversations.slice(0, LIMIT);
  const cursor = {
    id: hasNextPage ? pageUserConversations[LIMIT - 1].id : null,
    time: hasNextPage
      ? pageUserConversations[LIMIT - 1].created_at_cursor
      : null,
  };

  const conversationIds = pageUserConversations.map((c) => c.id);

  // If there are, get the conversation recipients and attach to the conversations
  const conversationRecipients = await getConversationParticipantsExceptUser(
    conversationIds,
    user.id,
  );

  const formatedConversations = pageUserConversations.map((c) => ({
    id: c.id,
    conversationParticipantId: c.conversation_participant_id,
    lastMessage: c.last_message,
    // TODO: see if a better way to do this
    recipient: conversationRecipients.filter(
      (cr) => cr.conversation_id === c.id,
    )[0].recipient,
    createdAt: c.created_at,
  }));

  res.status(200).json(
    new ApiResponse(200, "User's conversations", {
      conversations: formatedConversations,
      cursor,
      hasNextPage,
    }),
  );
};

export const GetConversationMessages = async (req: Request, res: Response) => {
  const user = req.user;
  const LIMIT = 20;

  const { conversationId } = GetConversationMessagesParamSchema.parse(
    req.params,
  );
  const { cursorId, cursorTime } = GetConversationMessagesQuerySchema.parse(
    req.query,
  );

  const conversation = await getConversationByIdAndWorkspaceId(
    conversationId,
    user.activeWorkspace,
  );

  if (!conversation) {
    throw ApiError.notFound('Conversation not found');
  }

  const conversationMessages = await getConversationMessages(
    conversationId,
    LIMIT + 1,
    cursorTime,
    cursorId,
  );

  if (!conversationMessages || conversationMessages.length < 1) {
    return res.status(200).json(
      new ApiResponse(200, 'Conversation messages', {
        messages: [],
        hasNextPage: null,
        cursor: {
          id: null,
          time: null,
        },
      }),
    );
  }

  const hasNextPage = conversationMessages.length > LIMIT;
  const pageConversationMessages = hasNextPage
    ? conversationMessages.slice(0, LIMIT)
    : conversationMessages;

  const cursor = {
    id: hasNextPage ? pageConversationMessages[LIMIT - 1].id : null,
    time: hasNextPage
      ? pageConversationMessages[LIMIT - 1].created_at_cursor
      : null,
  };

  const formatedMessages = pageConversationMessages.map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    isEdited: m.is_edited,
    sender: m.sender,
    content: m.content,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  }));

  res.status(200).json(
    new ApiResponse(200, 'Conversation messages', {
      messages: formatedMessages,
      hasNextPage,
      cursor,
    }),
  );
};
