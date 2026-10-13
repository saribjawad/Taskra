import { Avatar, AvatarFallback, AvatarGroup } from '#/components/ui/avatar'
import { getInitials } from '#/lib/utils'
import type { ConversationPerson } from '#/type/conversation'
import { Users } from 'lucide-react'

export function personName(person: ConversationPerson) {
  return person.full_name || person.username
}

export function conversationName(participants: ConversationPerson[]) {
  if (!participants.length) return 'Conversation'
  if (participants.length === 1) return personName(participants[0])
  const firstNames = participants.slice(0, 2).map(personName)
  const remaining = participants.length - firstNames.length
  return `${firstNames.join(', ')}${remaining ? ` + ${remaining}` : ''}`
}

export function ParticipantAvatars({
  participants,
  activeUserIds,
}: {
  participants: ConversationPerson[]
  activeUserIds: string[]
}) {
  if (participants.length > 1) {
    return (
      <AvatarGroup className="*:data-[slot=avatar]:size-7">
        {participants.slice(0, 3).map((person) => (
          <Avatar key={person.id} size="sm" className="relative">
            <AvatarFallback>{getInitials(personName(person))}</AvatarFallback>
            {activeUserIds.includes(person.id) && (
              <span className="absolute right-0 bottom-0 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
          </Avatar>
        ))}
      </AvatarGroup>
    )
  }

  const person = participants[0]
  if (!person) {
    return (
      <Avatar>
        <AvatarFallback>
          <Users className="size-4" />
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className="relative">
      <AvatarFallback>{getInitials(personName(person))}</AvatarFallback>
      {activeUserIds.includes(person.id) && (
        <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
      )}
    </Avatar>
  )
}
