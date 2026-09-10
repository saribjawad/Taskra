import { WebSocket, WebSocketServer } from 'ws';
import * as cookie from 'cookie';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayloadUser } from '../middlewares/auth.middleware';
import { Server } from 'node:http';

// Websocket Server
const wss = new WebSocketServer({
  noServer: true,
});

const workspaceRooms: Map<string, WebSocket[]> = new Map();

export function initWebSocket(server: Server) {
  server.on('upgrade', (request, socket, head) => {
    socket.on('error', (err) => {
      console.log('Error while upgrading socket', err);
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
      request.user = decoded;
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
    const user = payload.user;

    // Check if the room for user's active workspace exist
    if (workspaceRooms.get(user.activeWorkspace)) {
      const workspaceRoom = workspaceRooms.get(user.activeWorkspace);
      workspaceRoom?.push(ws);
    } else {
      // If not create one
      workspaceRooms.set(user.activeWorkspace, [ws]);
    }

    ws.on('error', console.error);

    ws.on('message', function (message) {
      console.log('message', String(message), 'bby', payload.user);
      const workspaceRoom = workspaceRooms.get(user.activeWorkspace);

      workspaceRoom?.forEach((w) => {
        if (ws !== w) {
          w.send(String(message));
        }
      });

      console.log(`Received message ${message} from user `);
    });

    ws.on('close', function () {
      console.log('ws closed');
    });
  });
}
