import { useState } from 'react'
import { Plus } from 'lucide-react'
import z from 'zod'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { useCreateTeamDocument, useCreateTeamLink } from '#/hooks/team.hooks'
import TaskDescriptionEditor from '#/components/tasks/TaskDescriptionEditor'

const teamLinkSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(24, 'Title cannot be longer than 24 characters'),
  url: z.url('Invalid URL'),
})

export function AddTeamLinkDialog({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [errors, setErrors] = useState<{
    title?: string
    url?: string
  }>({})
  const { mutateAsync, isPending } = useCreateTeamLink(teamId)

  async function submit() {
    if (isPending) return

    const result = teamLinkSchema.safeParse({
      title,
      url: url.trim(),
    })

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        title: fieldErrors.title?.[0],
        url: fieldErrors.url?.[0],
      })
      return
    }

    try {
      await mutateAsync(result.data)
      setOpen(false)
      setTitle('')
      setUrl('')
      setErrors({})
    } catch {
      // The mutation shows the request error.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setErrors({})
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Add team link">
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a team link</DialogTitle>
          <DialogDescription>
            Save a useful link for everyone on this team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setErrors((current) => ({ ...current, title: undefined }))
              }}
              placeholder="Link name"
              maxLength={24}
              aria-label="Link name"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={
                errors.title ? 'team-link-title-error' : undefined
              }
            />
            {errors.title && (
              <p
                id="team-link-title-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.title}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              value={url}
              onChange={(event) => {
                setUrl(event.target.value)
                setErrors((current) => ({ ...current, url: undefined }))
              }}
              placeholder="https://example.com"
              type="url"
              aria-label="Link URL"
              aria-invalid={Boolean(errors.url)}
              aria-describedby={errors.url ? 'team-link-url-error' : undefined}
            />
            {errors.url && (
              <p
                id="team-link-url-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.url}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={isPending}>
            Add link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddTeamDocumentDialog({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const { mutateAsync, isPending } = useCreateTeamDocument(teamId)

  async function submit() {
    if (!name.trim() || isPending) return
    try {
      await mutateAsync({ name: name.trim(), content })
      setOpen(false)
      setName('')
      setContent('')
    } catch {
      // The mutation shows the request error.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> New document
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[80vh] min-w-[70vw] max-h-[85vh] flex-col gap-4 lg:min-w-[50vw]">
        <DialogHeader>
          <DialogTitle>New team document</DialogTitle>
          <DialogDescription>
            Add a note or reference for your team.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Document name"
            maxLength={24}
            aria-label="Document name"
            autoFocus
          />
          <div className="min-h-0 flex-1">
            <TaskDescriptionEditor
              key={open ? 'document-editor-open' : 'document-editor-closed'}
              value={content}
              onChange={setContent}
              className="h-full [&_.bn-container]:h-full [&_.bn-editor]:!h-full [&_.bn-editor]:!min-h-0 [&_.bn-editor]:!max-h-none [&_.bn-editor]:overflow-y-auto"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={!name.trim() || isPending}
          >
            Create document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
