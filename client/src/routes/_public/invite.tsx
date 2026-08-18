import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { Spinner } from '#/components/ui/spinner'
import { useAuth } from '#/context/auth/auth-hook'
import { useSignOut } from '#/hooks/auth.hooks'
import {
  useDeclineInvitation,
  useAcceptInvitation,
  useVerifyInvitation,
} from '#/hooks/invitation.hooks'
import { router } from '#/main'
import type { InvitationStatus } from '#/service/invitation.service'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { CheckCircle2, TriangleAlert, XCircle } from 'lucide-react'
import z from 'zod'

interface WorkspaceInvitation {
  id: string
  status: InvitationStatus
  email: string
  role: string // TODO: temp update after adding roles
  sentby: {
    id: string
    username: string
    email: string
  }
  workspace: {
    id: string
    name: string
  }
}

export const WorkspaceInvitationTokenSchema = z.object({
  token: z.string().regex(/^[0-9a-fA-F]{64}$/, {
    message: 'Token must be a 64-character hex string (32 bytes)',
  }),
})

export const Route = createFileRoute('/_public/invite')({
  validateSearch: WorkspaceInvitationTokenSchema,
  component: RouteComponent,
  errorComponent: ({ reset }) => {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 text-center">
          <TriangleAlert className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              This invitation link is invalid
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </Shell>
    )
  },
})

/* ---------------------------------- */
/* Layout shell                       */
/* ---------------------------------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border bg-background p-8">
        {children}
      </div>
    </div>
  )
}

function avatarColor(seed: string) {
  const colors = [
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-sky-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-pink-500',
  ]
  const sum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[sum % colors.length]
}

function InvitationHeader({ invitation }: { invitation: WorkspaceInvitation }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        className={`flex size-12 items-center justify-center rounded-full text-lg font-medium text-white ${avatarColor(
          invitation.workspace.name,
        )}`}
      >
        {invitation.workspace.name[0]?.toUpperCase()}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {invitation.sentby.username}
          </span>{' '}
          invited you to join
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          {invitation.workspace.name}
        </h1>
      </div>
      <Badge variant="outline" className="capitalize">
        {invitation.role}
      </Badge>
    </div>
  )
}

/* ---------------------------------- */
/* Route                              */
/* ---------------------------------- */

function RouteComponent() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()

  const { user } = useAuth() as {
    user: { id: string; username: string; email: string } | null | undefined
  }

  // Mutations
  const { mutate: signOut } = useSignOut()
  const {
    data: invitation,
    isLoading,
    isError,
    error,
  } = useVerifyInvitation(token)

  const { mutate: acceptInvitation, isPending: isAccepting } =
    useAcceptInvitation()
  const { mutate: declineInvitation, isPending: isDeclining } =
    useDeclineInvitation()

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-muted-foreground">
          <Spinner />
          Verifying invitation…
        </div>
      </Shell>
    )
  }

  if (isError || !invitation) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 text-center">
          <TriangleAlert className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              This invitation is no longer available
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof AxiosError
                ? error?.response?.data.message
                : 'It may have expired or already been used.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.history.back()}
          >
            Go back
          </Button>
        </div>
      </Shell>
    )
  }

  // Where to send someone after they authenticate, so they land back here.
  const redirectTarget =
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : undefined

  function goToAuth(mode: 'sign-in' | 'sign-up') {
    sessionStorage.setItem('invite-redirect', JSON.stringify(redirectTarget))

    navigate({
      to: mode === 'sign-in' ? '/sign-in' : '/sign-up',
    })
  }

  const isResolved = invitation.status !== 'pending'
  const isLoggedIn = Boolean(user)
  const emailMatches =
    isLoggedIn && user!.email.toLowerCase() === invitation.email.toLowerCase()

  return (
    <Shell>
      <InvitationHeader invitation={invitation} />
      <Separator className="my-6" />

      {/* Invitation already resolved (accepted / declined / expired elsewhere) */}
      {isResolved && (
        <div className="flex flex-col items-center gap-2 text-center">
          {invitation.status === 'accepted' ? (
            <CheckCircle2 className="size-6 text-emerald-500" />
          ) : (
            <XCircle className="size-6 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {invitation.status === 'accepted' &&
              'This invitation has already been accepted.'}
            {invitation.status === 'declined' &&
              'This invitation has been declined.'}
            {invitation.status === 'expired' &&
              'This invitation has expired. Ask the workspace owner to send a new one.'}
            {!['accepted', 'declined', 'expired'].includes(invitation.status) &&
              `This invitation is no longer pending (${invitation.status}).`}
          </p>
        </div>
      )}

      {/* Pending, no one signed in — offer sign in / sign up for the invited email */}
      {!isResolved && !isLoggedIn && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Sign in or create an account with{' '}
            <span className="font-medium text-foreground">
              {invitation.email}
            </span>{' '}
            to accept this invitation.
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={() => goToAuth('sign-in')}>
              Sign in
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => goToAuth('sign-up')}
            >
              Create account
            </Button>
          </div>
        </div>
      )}

      {/* Pending, signed in as a different email */}
      {!isResolved && isLoggedIn && !emailMatches && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            You're signed in as{' '}
            <span className="font-medium text-foreground">{user!.email}</span>,
            but this invitation was sent to{' '}
            <span className="font-medium text-foreground">
              {invitation.email}
            </span>
            . To accept it, you need to switch to the invited account.
          </p>
          <Button
            onClick={() => {
              signOut()
              goToAuth('sign-in')
            }}
          >
            Sign in as {invitation.email}
          </Button>
          <span className="italic text-xs text-muted-foreground">
            You'll be logged out of your current account.
          </span>
        </div>
      )}

      {/* Pending, signed in with the matching email — accept / decline */}
      {!isResolved && isLoggedIn && emailMatches && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            You're signed in as{' '}
            <span className="font-medium text-foreground">{user!.email}</span>.
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              disabled={isAccepting || isDeclining}
              onClick={() =>
                acceptInvitation(token, {
                  onSuccess: () => {
                    navigate({ to: '/' })
                  },
                })
              }
            >
              {isAccepting ? (
                <>
                  <Spinner />
                  Accepting…
                </>
              ) : (
                'Accept invitation'
              )}
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              disabled={isAccepting || isDeclining}
              onClick={() => declineInvitation(token)}
            >
              {isDeclining ? (
                <>
                  <Spinner />
                  Declining…
                </>
              ) : (
                'Decline'
              )}
            </Button>
          </div>
        </div>
      )}
    </Shell>
  )
}
