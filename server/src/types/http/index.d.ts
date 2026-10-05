import * as http from 'http';

declare module 'http' {
  interface IncomingMessage {
    user: {
      id: string;
      email: string;
      fullName: string;
      activeWorkspace: string;
      role: WorkspaceMemberRole | null;
    };
  }
}
