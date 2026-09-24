export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  target_date: Date | null;
  updated_at: Date;
  created_at: Date;
}
