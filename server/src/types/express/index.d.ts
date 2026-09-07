import { WorkspaceMemberRole } from '../../models/workspace.model';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        activeWorkspace: string;
        role: WorkspaceMemberRole | null;
      };
    }
  }
}
