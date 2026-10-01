import {
  CheckCheck,
  Clock3,
  MessageSquare,
  UserPlus,
  UserCheck,
  UserX,
  ClipboardList,
  BadgeCheck,
  UserRoundCog,
  UsersRound,
  ListPlus,
  MessageSquareText,
  CalendarClock,
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
  'project:completed': { title: 'Project completed', icon: BadgeCheck },
  'project:lead_assigned': {
    title: 'Assigned as project lead',
    icon: UserRoundCog,
  },
  'project:member_assigned': { title: 'Added to project', icon: UsersRound },
  'project:task_added': { title: 'Task added to project', icon: ListPlus },
  'project:commented': {
    title: 'New project comment',
    icon: MessageSquareText,
  },
  'project:target_date_soon': {
    title: 'Project target date soon',
    icon: CalendarClock,
  },
}
