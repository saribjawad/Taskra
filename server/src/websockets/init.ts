import { WebSocket, WebSocketServer } from 'ws';
import * as cookie from 'cookie';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayloadUser } from '../middlewares/auth.middleware';
import { Server } from 'node:http';
import { NotificationPayloadType, WebsocketMessagePayload } from './types';
import logger from '../utils/logger';
import {
  getConversationParticipantsExceptUser,
  getConversationsUserIsPartOf,
} from '../services/conversations.service';

// Websocket Server
const wss = new WebSocketServer({
  noServer: true,
});

const workspaceRooms: Map<
  string,
  {
    id: string;
    ws: WebSocket;
  }[]
> = new Map();
const chatRooms: Map<string, { id: string; ws: WebSocket }[]> = new Map();

async function getActiveConversationSockets(
  conversationId: string,
  userId: string,
  workspaceId: string,
) {
  const recipients = await getConversationParticipantsExceptUser(
    [conversationId],
    userId,
  );
  const participantIds = new Set([
    userId,
    ...recipients.map((recipient) => recipient.recipient.id),
  ]);

  return (workspaceRooms.get(workspaceId) ?? []).filter((member) =>
    participantIds.has(member.id),
  );
}

export function initWebSocket(server: Server) {
  // On upgrade network
  server.on('upgrade', (request, socket, head) => {
    socket.on('error', (err) => {
      logger.error('Error while upgrading socket', err);
    });

    // Check for authentication
    const { accessToken } = cookie.parseCookie(request.headers.cookie || '');

    if (!accessToken) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      const decoded = jwt.verify(accessToken, env.JWT_SECRET) as JwtPayloadUser;
      request.user = { ...decoded, fullName: decoded.fullName ?? '' };
    } catch (error) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Complete the handshake
    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', async (ws, payload) => {
    logger.info(`Welcome, ${payload.user.email}, to the server`);

    const user = payload.user;

    // If a room exists for the workspace, if not create one
    // And push the user in the room
    if (workspaceRooms.get(user.activeWorkspace)) {
      const workspaceRoom = workspaceRooms.get(user.activeWorkspace);
      workspaceRoom?.push({
        id: user.id,
        ws,
      });
    } else {
      workspaceRooms.set(user.activeWorkspace, [
        {
          id: user.id,
          ws,
        },
      ]);
    }

    // Check if user is part of conversations
    try {
      const userConversations = await getConversationsUserIsPartOf(user.id);

      if (userConversations.length >= 1) {
        // If chatroom exists add the user in it
        // Else create the room
        for (const { conversation_id } of userConversations) {
          const room = chatRooms.get(conversation_id);

          if (room) {
            if (!room.some((member) => member.ws === ws)) {
              room.push({ id: user.id, ws });
            }
          } else {
            chatRooms.set(conversation_id, [
              {
                id: user.id,
                ws,
              },
            ]);
          }
        }
      }
    } catch (e) {
      logger.error(
        "Error occured while finding user's conversation on WS init",
        e,
      );
    }

    const workspaceMembers = workspaceRooms.get(user.activeWorkspace);

    if (workspaceMembers && workspaceMembers.length > 1) {
      // Send ID's of active people to user except his own
      const activeUsers = workspaceMembers
        ?.filter((u) => u.id !== user.id)
        .map((u) => u.id);
      ws.send(
        JSON.stringify({
          type: 'active:users',
          payload: {
            users: activeUsers,
          },
        }),
      );
    }

    if (workspaceMembers && workspaceMembers.length > 1) {
      // Send USER:CONNECTED to the active members in workspace
      for (const member of workspaceMembers) {
        if (member.id !== user.id)
          member.ws.send(
            JSON.stringify({
              type: 'user:connected',
              payload: {
                id: user.id,
              },
            }),
          );
      }
    }

    ws.on('error', console.error);

    ws.on('message', function (message) {
      const { payload, type } = JSON.parse(
        String(message),
      ) as WebsocketMessagePayload;

      /**
       * CONVERSATION:NEW
       */
      if (type === 'conversation:new') {
        getActiveConversationSockets(
          payload.conversationId,
          user.id,
          user.activeWorkspace,
        )
          .then((conversationSockets) => {
            chatRooms.set(payload.conversationId, [
              ...new Map(
                conversationSockets.map((member) => [member.ws, member]),
              ).values(),
            ]);
          })
          .catch((error) => {
            logger.error(
              'Could not populate conversation websocket room',
              error,
            );
          });
      }

      /**
       * MESSAGE:SEND
       */
      if (type === 'message:send') {
        const chatRoom = chatRooms.get(payload.conversationId);

        chatRoom?.forEach((member) => {
          if (
            member.id !== user.id &&
            member.ws.readyState === WebSocket.OPEN
          ) {
            member.ws.send(
              JSON.stringify({
                type: 'message:new',
                payload: {
                  conversationId: payload.conversationId,
                  message: payload.message,
                },
              }),
            );
          }
        });
      }
    });

    ws.on('close', function () {
      for (const [conversationId, chatRoom] of chatRooms) {
        const activeSockets = chatRoom.filter((member) => member.ws !== ws);
        if (activeSockets.length) {
          chatRooms.set(conversationId, activeSockets);
        } else {
          chatRooms.delete(conversationId);
        }
      }

      const roomMembers = workspaceRooms.get(user.activeWorkspace);

      if (roomMembers && roomMembers.length <= 1) {
        workspaceRooms.delete(user.activeWorkspace);
      } else if (roomMembers) {
        workspaceRooms.set(
          user.activeWorkspace,
          roomMembers?.filter((rm) => rm.ws !== ws),
        );

        for (const member of roomMembers) {
          // Send USER:DISCONNECTED to the connected members
          member.ws.send(
            JSON.stringify({
              type: 'user:disconnected',
              payload: {
                id: user.id,
              },
            }),
          );
        }
      }
    });
  });
}

// ==================================================================================
// WebSocket Helpers
// ==================================================================================

export function notifyWorkspace(
  workspaceId: string,
  payload: NotificationPayloadType,
) {
  const members = workspaceRooms.get(workspaceId);

  if (members && members.length >= 1) {
    for (const m of members) {
      m.ws.send(JSON.stringify(payload));
    }
  }
}

export function notifyMemberInWorkspace(
  userId: string,
  workspaceId: string,
  payload: NotificationPayloadType,
) {
  const members = workspaceRooms.get(workspaceId);

  if (members && members.length >= 1) {
    for (const m of members) {
      if (m.id === userId) {
        m.ws.send(JSON.stringify(payload));
      }
    }
  }
}
