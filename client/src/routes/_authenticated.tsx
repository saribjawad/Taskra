import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { TooltipProvider } from '#/components/ui/tooltip'
import { useAuth } from '#/context/auth/auth-hook'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedRoutesLayout,
})

function AuthenticatedRoutesLayout() {
  const { user, isLoading } = useAuth()
  const navigate = Route.useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/sign-in' })
    }
  }, [user, isLoading, navigate])

  if (isLoading) return <div>Loading...</div> // TODO: add a spinner

  if (!user) return null // will redirect via effect

  return (
    <TooltipProvider>
      <Outlet />
    </TooltipProvider>
  )
}
