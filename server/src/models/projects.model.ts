import z from 'zod';
import { Priority } from '../schemas/common.schema';
import { ProjectStatus } from '../schemas/projects.schema';

export type ProjectPriorityType = z.infer<typeof Priority>;
export type ProjectStatusType = z.infer<typeof ProjectStatus>;

export interface Project {
  id: string;
  name: string;
  short_summary: string | null;
  description: string | null;
  priority: ProjectPriorityType;
  status: string | null;
  lead: string | null;
  start_date: Date | null;
  target_date: Date | null;
  updated_at: Date;
  created_at: Date;
}
