import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { useCreateTeam } from '#/hooks/team.hooks'

export function CreateTeamDialog({
  workspaceId,
  trigger,
}: {
  workspaceId: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [description, setDescription] = useState('')
  const { mutateAsync, isPending } = useCreateTeam(workspaceId)

  async function submit() {
    if (!name.trim() || identifier.trim().length < 3 || isPending) return
    try {
      await mutateAsync({
        name: name.trim(),
        identifier: identifier.trim().toUpperCase(),
        ...(description.trim() ? { description: description.trim() } : {}),
      })
      setOpen(false)
      setName('')
      setIdentifier('')
      setDescription('')
    } catch {
      // The mutation displays the request error.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
          <DialogDescription>
            Set up a team in this workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Team name"
            maxLength={24}
            aria-label="Team name"
          />
          <Input
            value={identifier}
            onChange={(event) =>
              setIdentifier(event.target.value.toUpperCase().slice(0, 6))
            }
            placeholder="Identifier (3–6 characters)"
            minLength={3}
            maxLength={6}
            aria-label="Team identifier"
          />
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
            aria-label="Team description"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={
              !name.trim() || identifier.trim().length < 3 || isPending
            }
          >
            Create team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
