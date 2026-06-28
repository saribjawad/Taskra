import { useAuth } from '#/context/authContext'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_authenticated/')({
  component: Index,
})

function Index() {
  const { user, isLoading } = useAuth()
  const navigate = Route.useNavigate()

  useEffect(() => {
    if (isLoading) return

    navigate({
      to: user?.activeWorkspace ? '/$workspaceId' : '/create-workspace',
      params: user?.activeWorkspace
        ? { workspaceId: user.activeWorkspace }
        : undefined,
      replace: true,
    })
  }, [user, isLoading, navigate])

  return null
}
