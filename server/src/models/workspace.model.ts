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
  created_at: Date;
};
