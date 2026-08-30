import type { MemberRole } from '#/type'
import { Check, ChevronsUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

const ROLE_LABEL: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: MemberRole
  onChange: (r: MemberRole) => void
  disabled?: boolean
}) {
  const roles: MemberRole[] = ['admin', 'member', 'owner', 'viewer']
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button className="flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50">
          {ROLE_LABEL[value]}
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        {roles.map((r) => (
          <DropdownMenuItem
            key={r}
            onClick={() => onChange(r)}
            className="flex items-center justify-between text-sm"
          >
            {ROLE_LABEL[r]}
            {r === value && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default RoleSelect
