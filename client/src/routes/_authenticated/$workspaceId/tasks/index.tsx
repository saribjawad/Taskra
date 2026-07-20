import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$workspaceId/tasks/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$workspaceId/tasks/assigned',
      params: {
        workspaceId: params.workspaceId,
      },
    })
  },
})
