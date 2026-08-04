export type AttachmentsMimeTypes =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export type Attachments = {
  id: string;
  task_id: string;
  name: string;
  size: number;
  mime_type: AttachmentsMimeTypes;
  created_at: Date;
};
