import {
  CheckCheck,
  Clock3,
  MessageSquare,
  UserPlus,
  UserCheck,
  UserX,
  ClipboardList,
} from 'lucide-react'
import type { NotificationType } from '#/type/notification'

export const notificationPresentation: Record<
  NotificationType,
  { title: string; icon: typeof CheckCheck }
> = {
  'task:completed': { title: 'Task completed', icon: CheckCheck },
  'task:assigned': { title: 'Task assigned to you', icon: UserPlus },
  'task:reporter_assigned': { title: 'Added as reporter', icon: ClipboardList },
  'task:commented': { title: 'New comment', icon: MessageSquare },
  'task:due_soon': { title: 'Task due soon', icon: Clock3 },
  'invite:accepted': { title: 'Invitation accepted', icon: UserCheck },
  'invite:declined': { title: 'Invitation declined', icon: UserX },
}
