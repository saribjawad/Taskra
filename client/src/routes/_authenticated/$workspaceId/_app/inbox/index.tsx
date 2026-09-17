import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/inbox/',
)({
  beforeLoad: ({ params }) => {
    // Opening Inbox starts on the notifications page.
    throw redirect({
      to: '/$workspaceId/inbox/notifications',
      params: { workspaceId: params.workspaceId },
    })
  },
})
