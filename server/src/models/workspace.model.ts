export type Workspace = {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
};

export type WorkspaceMemberRole = 'member' | 'admin' | 'viewer' | 'owner';

export type WorkspaceMember = {
  id: string;
  user_id: string;
  workspace_id: string;
  role: WorkspaceMemberRole;
  joined_at: Date;
};

export interface WorkspaceMemberWithUserDetails extends Omit<
  WorkspaceMember,
  'user_id'
> {
  user: {
    id: string;
    username: string;
    full_name: string;
    email: string;
  };
}
