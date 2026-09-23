import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { cn } from '#/lib/utils'

const colors = ['bg-cyan-700', 'bg-violet-700', 'bg-pink-700', 'bg-amber-700']

export default function ProjectPersonAvatar({
  name,
  className,
}: {
  name: string | null | undefined
  className?: string
}) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0]?.slice(0, 2).toUpperCase() ?? '?')
  const color = [...(name ?? '')].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  )

  return (
    <Avatar className={cn('size-6', className)} aria-hidden="true">
      <AvatarFallback
        className={cn('text-[10px] text-white', colors[color % colors.length])}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
