export type ProjectActivityType =
  | 'project_created'
  | 'project_updated'
  | 'lead_changed'
  | 'member_added'
  | 'member_removed'
  | 'priority_changed'
  | 'status_changed'
  | 'start_date_changed'
  | 'end_date_changed'
  | 'milestone_added'
  | 'milestone_removed'
  | 'milestone_changed';

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id: string;
  description: string;
  type: ProjectActivityType;
  metadata: {
    field: string;
    from: string;
    to: string;
  };
  updated_at: Date;
  created_at: Date;
}

export interface ProjectActivityWithComments {
  id: string;
  project_id: string;
  user_id: string;
  username: string;
  content: string | null;
  type: ProjectActivityType | null;
  metadata: {
    field: string;
    from: string;
    to: string;
  } | null;
  description: string | null;
  activity_type: 'comment' | 'activity';
  updated_at: Date | null;
  created_at: Date;
}
