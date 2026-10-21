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
import { Label } from '#/components/ui/label'

function generateIdentifier(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
}

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
  const [identifierEdited, setIdentifierEdited] = useState(false)
  const [description, setDescription] = useState('')
  const { mutateAsync, isPending } = useCreateTeam(workspaceId)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setName('')
      setIdentifier('')
      setIdentifierEdited(false)
      setDescription('')
    }
  }

  async function submit() {
    if (!name.trim() || !/^[A-Z]{3,6}$/.test(identifier) || isPending) return
    try {
      await mutateAsync({
        name: name.trim(),
        identifier: identifier.trim().toUpperCase(),
        ...(description.trim() ? { description: description.trim() } : {}),
      })
      handleOpenChange(false)
    } catch {
      // The mutation displays the request error.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
          <DialogDescription>
            Set up a team in this workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value
                setName(nextName)
                if (!identifierEdited) {
                  setIdentifier(generateIdentifier(nextName))
                }
              }}
              placeholder="Team name"
              maxLength={24}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-identifier">Identifier</Label>
            <Input
              id="team-identifier"
              value={identifier}
              onChange={(event) => {
                setIdentifierEdited(true)
                setIdentifier(
                  event.target.value
                    .replace(/[^a-zA-Z]/g, '')
                    .toUpperCase()
                    .slice(0, 6),
                )
              }}
              placeholder="3–6 uppercase letters"
              minLength={3}
              maxLength={6}
              pattern="[A-Z]{3,6}"
              aria-describedby="team-identifier-hint"
              disabled={isPending}
            />
            <p
              id="team-identifier-hint"
              className="text-xs text-muted-foreground"
            >
              3–6 uppercase letters. Generated from the team name; you can edit
              it.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-description">Description (optional)</Label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe this team"
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={
              !name.trim() || !/^[A-Z]{3,6}$/.test(identifier) || isPending
            }
          >
            Create team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
