export type Workspace = {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
};

export type WorkspaceMember = {
  id: string;
  user_id: string;
  workspace_id: string;
  created_at: Date;
};
