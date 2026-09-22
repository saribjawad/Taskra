import z from 'zod';
import { Priority } from '../schemas/common.schema';
import { ProjectStatus } from '../schemas/projects.schema';

export type ProjectPriorityType = z.infer<typeof Priority>;
export type ProjectStatusType = z.infer<typeof ProjectStatus>;

export type ProjectWithLead = Omit<Project, 'lead_id'> & {
  lead: {
    id: string;
    username: string;
    email: string;
  } | null;
};

export interface Project {
  id: string;
  name: string;
  short_summary: string | null;
  description: string | null;
  priority: ProjectPriorityType;
  status: ProjectStatusType;
  lead_id: string | null;
  workspace_id: string;
  start_date: Date | null;
  target_date: Date | null;
  updated_at: Date;
  created_at: Date;
}
