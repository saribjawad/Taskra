import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_public')({
  beforeLoad: async ({ context }) => {
    if (context.auth && context.auth?.user) {
      throw redirect({
        to: '/',
      })
    }
  },
})
