import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$workspaceId/my-tasks/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$workspaceId/my-tasks/assigned',
      params: {
        workspaceId: params.workspaceId,
      },
    })
  },
})
