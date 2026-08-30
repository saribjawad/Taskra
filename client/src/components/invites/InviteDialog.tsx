import type { MemberRole } from '#/type'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Plus, X } from 'lucide-react'
import RoleSelect from './RoleSelect'
import { Spinner } from '../ui/spinner'

function InviteDialog({
  onInvite,
  isInviting,
}: {
  onInvite: (emails: string[], role: MemberRole) => Promise<void>
  isInviting: boolean
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [emails, setEmails] = useState<string[]>([])
  const [role, setRole] = useState<MemberRole>('member')

  const commitDraft = () => {
    const value = draft.trim().replace(/,$/, '')
    if (!value) return
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    if (isValid && !emails.includes(value)) {
      setEmails((prev) => [...prev, value])
    }
    setDraft('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitDraft()
    }
    if (e.key === 'Backspace' && !draft && emails.length) {
      setEmails((prev) => prev.slice(0, -1))
    }
  }

  const reset = () => {
    setDraft('')
    setEmails([])
    setRole('member')
  }

  const handleSend = async () => {
    const pending = [...emails]
    if (draft.trim()) {
      const value = draft.trim()
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) pending.push(value)
    }
    if (!pending.length) return
    await onInvite(pending, role)
    reset()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Invite people
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to workspace</DialogTitle>
          <DialogDescription>
            Enter one or more email addresses. New members join as the role you
            choose below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
            {emails.map((email) => (
              <span
                key={email}
                className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-foreground"
              >
                {email}
                <button
                  type="button"
                  onClick={() =>
                    setEmails((prev) => prev.filter((e) => e !== email))
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              disabled={isInviting}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commitDraft}
              placeholder={emails.length ? '' : 'name@company.com'}
              className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Role</span>
            <RoleSelect disabled={isInviting} value={role} onChange={setRole} />
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={isInviting}
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isInviting || (!emails.length && !draft.trim())}
          >
            {isInviting && <Spinner />}
            Send invite{emails.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InviteDialog
