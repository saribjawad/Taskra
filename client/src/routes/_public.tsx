import { useAuth } from '#/context/auth/auth-hook'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_public')({
  component: PublicRoutesLayout,
})

function PublicRoutesLayout() {
  const { user, isLoading } = useAuth()
  const navigate = Route.useNavigate()

  const isInvitePage = window.location.pathname === '/invite'

  useEffect(() => {
    if (!isLoading && user && !isInvitePage) {
      if (user.activeWorkspace) {
        navigate({ to: '/' })
      } else {
        navigate({ to: '/create-workspace' })
      }
    }
  }, [user, isLoading, navigate])

  if (isLoading) return <div>Loading...</div> // TODO: add a spinner

  // Allow invite whether logged in or not
  if (isInvitePage) {
    return <Outlet />
  }

  if (user) return null // will redirect via effect

  return <Outlet />
}
