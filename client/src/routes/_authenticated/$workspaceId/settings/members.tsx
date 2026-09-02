import { useState } from 'react'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { MoreHorizontal, Search, Mail } from 'lucide-react'

import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'
import type { MemberRole } from '#/type'
import InviteDialog from '#/components/invites/InviteDialog'
import RoleSelect from '#/components/invites/RoleSelect'
import { ROLE_LABEL } from '#/constants'
import {
  useGetPendingInvites,
  useInviteUser,
  useResendInvite,
  useRevokeInvite,
} from '#/hooks/invitation.hooks'
import {
  useGetWorkspaceUsers,
  useRemoveMemberFromWorkspace,
} from '#/hooks/workspace.hooks'
import { Spinner } from '#/components/ui/spinner'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { useAuth } from '#/context/auth/auth-hook'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/settings/members',
)({
  component: RouteComponent,
})

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------- role badge / selector ----------

function RoleBadge({ role }: { role: MemberRole }) {
  const styles: Record<MemberRole, string> = {
    owner: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    admin: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    member: 'bg-muted text-muted-foreground border-transparent',
    viewer: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  }
  return (
    <Badge
      variant="outline"
      className={cn('rounded-md px-2 py-0.5 text-xs font-medium', styles[role])}
    >
      {ROLE_LABEL[role]}
    </Badge>
  )
}

function PendingInvitesSkeleton() {
  return (
    <div className="mt-8">
      <Skeleton className="h-3 w-28" />
      <div className="mt-2 divide-y divide-border rounded-lg border border-border">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MemberTableSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell className="py-2.5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          </TableCell>
          <TableCell className="py-2.5">
            <Skeleton className="h-7 w-24" />
          </TableCell>
          <TableCell className="py-2.5">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="py-2.5">
            <Skeleton className="ml-auto h-8 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

// ---------- Page ----------

function RouteComponent() {
  const { user: loggedInUser } = useAuth()
  const params = useParams({
    strict: false,
  })

  const { mutateAsync: inviteUser, isPending: isInvitingUser } = useInviteUser()
  const { data: pendingInvites, isPending: isPendingInvitesLoading } =
    useGetPendingInvites(params.workspaceId!!)
  const { data: workspaceUsers, isPending: isWorkspaceUsersLoading } =
    useGetWorkspaceUsers(params.workspaceId!!)
  const {
    mutate: revokeInvitation,
    isPending: isRevokingInvitation,
    variables: revokingInvitationId,
  } = useRevokeInvite()
  const {
    mutate: resendInvitation,
    isPending: isResendingInvitation,
    variables: resendingInvitationId,
  } = useResendInvite()
  const {
    mutate: removeMemberFromWorkspace,
    isPending: isRemovingMemberFromWorkspace,
    variables: removingMemberVariables,
  } = useRemoveMemberFromWorkspace()

  const [query, setQuery] = useState('')

  const handleInvite = async (emails: string[], role: MemberRole) => {
    await inviteUser({ emails, role, workspaceId: params.workspaceId!! })
  }

  const handleRoleChange = (id: string, role: MemberRole) => {
    // TODO: call your update-role mutation here instead
  }

  const handleRemoveMember = (id: string) => {
    removeMemberFromWorkspace({
      workspaceId: params.workspaceId!!,
      memberId: id,
    })
  }

  const handleRevokeInvite = (id: string) => {
    revokeInvitation(id)
  }

  const handleResendInvite = (id: string) => {
    resendInvitation(id)
  }

  return (
    <div className="mx-auto w-full  px-6 py-10">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workspaceUsers && workspaceUsers.length}{' '}
            {workspaceUsers && workspaceUsers.length === 1
              ? 'person has'
              : 'people have'}{' '}
            access to this workspace
          </p>
        </div>
        <InviteDialog onInvite={handleInvite} isInviting={isInvitingUser} />
      </div>

      {/* search */}
      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members"
          className="h-8 pl-8 text-sm"
        />
      </div>

      {/* pending invites */}
      {isPendingInvitesLoading && <PendingInvitesSkeleton />}

      {!isPendingInvitesLoading &&
        pendingInvites &&
        pendingInvites.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pending invites
            </h2>
            <div className="mt-2 divide-y divide-border rounded-lg border border-border">
              {pendingInvites.map((invite) => {
                const isResendingThisInvite =
                  isResendingInvitation && resendingInvitationId === invite.id
                const isRevokingThisInvite =
                  isRevokingInvitation && revokingInvitationId === invite.id
                const isUpdatingThisInvite =
                  isResendingThisInvite || isRevokingThisInvite

                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">
                          {invite.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Invited {formatDate(invite.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={invite.role} />
                      <Button
                        variant="ghost"
                        disabled={isUpdatingThisInvite}
                        onClick={() => handleResendInvite(invite.id)}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        {isResendingThisInvite && <Spinner />}
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={isUpdatingThisInvite}
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="text-xs font-medium text-muted-foreground hover:text-destructive"
                      >
                        {isRevokingThisInvite && <Spinner />}
                        Revoke
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      {/* member table */}
      <div className="mt-8">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          All members
        </h2>
        <div className="mt-2 overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Joined
                </TableHead>
                <TableHead className="h-9 w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isWorkspaceUsersLoading && <MemberTableSkeleton />}

              {!isWorkspaceUsersLoading &&
                workspaceUsers &&
                workspaceUsers.map((user) => {
                  const isRemovingThisMember =
                    isRemovingMemberFromWorkspace &&
                    removingMemberVariables?.memberId === user.id
                  const isYourself = user.id === loggedInUser?.id

                  return (
                    <TableRow key={user.id} className="group">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={user.username} />
                            <AvatarFallback className="text-[10px]">
                              {initials(user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-none text-foreground">
                              {user.username}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        {user.role === 'owner' || isYourself ? (
                          <RoleBadge role={user.role} />
                        ) : (
                          <RoleSelect
                            value={user.role}
                            onChange={(r) => handleRoleChange(user.id, r)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 text-sm text-muted-foreground">
                        {formatDate(user?.joined_at)}
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        {user.role !== 'owner' && !isYourself && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="rounded-md p-1 text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground group-hover:opacity-100">
                                {isRemovingThisMember ? (
                                  <Spinner />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                disabled={isRemovingThisMember}
                                onClick={() => handleRemoveMember(user.id)}
                                className="text-sm text-destructive focus:text-destructive"
                              >
                                {isRemovingThisMember && <Spinner />}
                                Remove from workspace
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}

              {/* {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No members match "{query}"
                  </TableCell>
                </TableRow>
              )} */}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
