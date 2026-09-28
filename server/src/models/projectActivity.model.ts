export type ProjectActivityType =
  | 'project_created'
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

export interface ProjectActivty {
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
