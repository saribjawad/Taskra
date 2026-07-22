import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$workspaceId/')({
  loader: ({ params }) => {
    throw redirect({
      to: '/$workspaceId/my-tasks',
      params: {
        workspaceId: params.workspaceId,
      },
    })
  },
})
