import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/my-tasks/',
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$workspaceId/my-tasks/assigned',
      search: { page: 1, limit: 10 },
      params: {
        workspaceId: params.workspaceId,
      },
    })
  },
})
