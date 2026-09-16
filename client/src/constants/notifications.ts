import {
  CheckCheck,
  Clock3,
  MessageSquare,
  UserPlus,
  ClipboardList,
} from 'lucide-react'
import type { MessageType } from '#/context/websocket/websocket-provider'

export const notificationPresentation: Record<
  MessageType,
  { title: string; icon: typeof CheckCheck }
> = {
  'task:completed': { title: 'Task completed', icon: CheckCheck },
  'task:assigned': { title: 'Task assigned to you', icon: UserPlus },
  'task:reporter_assigned': { title: 'Added as reporter', icon: ClipboardList },
  'task:commented': { title: 'New comment', icon: MessageSquare },
  'task:due_soon': { title: 'Task due soon', icon: Clock3 },
}
