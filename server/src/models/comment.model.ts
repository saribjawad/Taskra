export type Comment = {
  id: string;
  task_id?: string;
  user_id: string;
  project_id?: string;
  content: string;
  updated_at: Date;
  created_at: Date;
};

export type CommentWithAuthor = {
  id: string;
  user_id: string;
  username: string;
  content: string;
  updated_at: Date;
  created_at: Date;
};
