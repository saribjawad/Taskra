import { Attachment } from './attachments.model';
import { TaskLabelType, TaskPriorityType, TaskStatusType } from './task.model';

export type SubTask = {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  status: TaskStatusType;
  priority: TaskPriorityType;
  label: TaskLabelType | null;
  assignee: string | null;
  created_at: Date;
  updated_at: Date;
  attachments?: Attachment[];
};

export type SubTaskSummary = Pick<
  SubTask,
  'id' | 'title' | 'status' | 'priority' | 'label' | 'assignee'
>;
