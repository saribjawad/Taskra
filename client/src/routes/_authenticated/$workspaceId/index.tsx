import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$workspaceId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$workspaceId/tasks',
      params: {
        workspaceId: params.workspaceId,
      },
    })
  },
})
