import { WorkspaceMemberRole } from '../../models/workspace.model';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        fullName: string;
        activeWorkspace: string;
        role: WorkspaceMemberRole | null;
      };
    }
  }
}
