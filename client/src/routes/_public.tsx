import { useAuth } from '#/context/authContext'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_public')({
  component: PublicRoutesLayout,
})

function PublicRoutesLayout() {
  const { user, isLoading } = useAuth()
  const navigate = Route.useNavigate()

  useEffect(() => {
    console.log('use effect')
    if (!isLoading && user) {
      if (user.activeWorkspace) {
        navigate({ to: '/' })
      } else {
        navigate({ to: '/create-workspace' })
      }
    }
  }, [user, isLoading, navigate])

  if (isLoading) return <div>Loading...</div> // TODO: add a spinner

  if (user) return null // will redirect via effect

  return <Outlet />
}
