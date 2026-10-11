import { WebSocket, WebSocketServer } from 'ws';
import * as cookie from 'cookie';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayloadUser } from '../middlewares/auth.middleware';
import { Server } from 'node:http';
import { NotificationPayloadType } from './types';
import logger from '../utils/logger';

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

  wss.on('connection', (ws, payload) => {
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

    ws.on('error', console.error);

    ws.on('message', function (message) {
      const payload = JSON.parse(String(message));
      console.log(payload);
    });

    ws.on('close', function () {
      const roomMembers = workspaceRooms.get(user.activeWorkspace);

      if (roomMembers && roomMembers.length <= 1) {
        workspaceRooms.delete(user.activeWorkspace);
      } else if (roomMembers) {
        workspaceRooms.set(
          user.activeWorkspace,
          roomMembers?.filter((rm) => rm.ws !== ws),
        );
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
