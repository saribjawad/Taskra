export type ProjectMemberWithUser = Omit<ProjectMember, 'user_id'> & {
  user: {
    id: string;
    username: string;
    full_name: string;
    email: string;
  };
};

export type ProjectMemberWithUserId = ProjectMember & {
  user: {
    id: string;
    username: string;
    full_name: string;
    email: string;
  };
};

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  updated_at: Date;
  created_at: Date;
}
