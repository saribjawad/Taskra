export type ProjectMemberWithUser = Omit<ProjectMember, 'user_id'> & {
  id: string;
  username: string;
  email: string;
};

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  updated_at: Date;
  created_at: Date;
}
