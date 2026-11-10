export type AttachmentsMimeTypes =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export type Attachment = {
  id: string;
  type: 'task' | 'sub-task' | 'project';
  task_id: string | null;
  sub_task_id: string | null;
  project_id: string | null;
  comment_id: string | null;
  name: string;
  size: number;
  mime_type: AttachmentsMimeTypes;
  storage_id: string;
  created_at: Date;
};

export type AttachmentOwner =
  | { type: 'task'; taskId: string }
  | { type: 'sub-task'; subTaskId: string }
  | { type: 'project'; projectId: string };
