import z from 'zod';
import { Priority } from '../schemas/common.schema';
import { TaskFilter, TaskLabel, TaskStatus } from '../schemas/task.schema';

export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'cancelled';

export type TaskPriorityType = z.infer<typeof Priority>;
export type TaskLabelType = z.infer<typeof TaskLabel>;
export type TaskFilterType = z.infer<typeof TaskFilter>;
export type TaskStatusType = z.infer<typeof TaskStatus>;

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatusType;
  priority: TaskPriorityType;
  label: TaskLabelType;
  assignee: string;
  creator: string;
  reporter: string;
  start_date: Date | null;
  due_date: Date | null;
  completed_date: Date | null;
  workspace_id: string;
  project_id: string | null;
  project_milestone_id: string | null;
  updated_at: Date;
  created_at: Date;
};
