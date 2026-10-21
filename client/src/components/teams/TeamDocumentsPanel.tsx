import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Skeleton } from '#/components/ui/skeleton'
import { useGetTeamDocuments } from '#/hooks/team.hooks'
import type { Team, TeamDocument } from '#/type/team'
import { AddTeamDocumentDialog } from './TeamResourceDialogs'
import TaskDescriptionViewer from '#/components/tasks/TaskDescriptionViewer'

export function TeamDocumentsPanel({ team }: { team: Team }) {
  const [selectedDocument, setSelectedDocument] = useState<TeamDocument | null>(
    null,
  )
  const {
    data: documents,
    isPending,
    isError,
    refetch,
  } = useGetTeamDocuments(team.id)

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Documents shared with {team.name}.
          </p>
        </div>
        <AddTeamDocumentDialog teamId={team.id} />
      </div>

      <div className="mt-6 divide-y divide-border/60 border-y border-border/60">
        {isPending ? (
          Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 py-4">
              <Skeleton className="size-8 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          ))
        ) : isError ? (
          <div role="alert" className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Unable to load team documents.
            </p>
            <Button variant="link" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : documents?.length ? (
          documents.map((document) => (
            <button
              key={document.id}
              type="button"
              onClick={() => setSelectedDocument(document)}
              className="flex w-full items-center gap-3 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium">
                {document.name}
              </span>
            </button>
          ))
        ) : (
          <div className="py-14 text-center">
            <FileText className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No documents yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a document to share information with your team.
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={selectedDocument !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDocument(null)
        }}
      >
        <DialogContent className="flex h-[85vh] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-6 py-5 pr-12">
            <DialogTitle className="truncate text-base">
              {selectedDocument?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Team document content
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-6 py-5 [&_.bn-editor]:px-0">
            {selectedDocument && (
              <TaskDescriptionViewer
                key={selectedDocument.id}
                value={selectedDocument.content ?? ''}
                className="h-full [&_.bn-container]:h-full [&_.bn-editor]:!h-full [&_.bn-editor]:!min-h-0 [&_.bn-editor]:!max-h-none [&_.bn-editor]:overflow-y-auto"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
