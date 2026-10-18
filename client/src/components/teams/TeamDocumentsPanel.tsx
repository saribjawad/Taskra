import { FileText } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { useGetTeamDocuments } from '#/hooks/team.hooks'
import type { Team } from '#/type/team'
import { AddTeamDocumentDialog } from './TeamResourceDialogs'
import TaskDescriptionViewer from '#/components/tasks/TaskDescriptionViewer'

export function TeamDocumentsPanel({ team }: { team: Team }) {
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
            <article key={document.id} className="flex gap-3 py-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium">
                  {document.name}
                </h2>
                {document.content && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    <TaskDescriptionViewer value={document.content} />
                  </div>
                )}
              </div>
            </article>
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
    </section>
  )
}
