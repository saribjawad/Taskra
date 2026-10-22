import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addTeamMembers,
  createTeam,
  createTeamDocument,
  createTeamLink,
  deleteTeam,
  getTeamDocuments,
  getTeamLinks,
  getTeamMembers,
  getTeamProjects,
  getTeams,
  removeTeamMember,
} from '#/service/team.service'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'

export function useGetTeams(workspaceId: string) {
  return useQuery({
    queryKey: ['teams', workspaceId],
    queryFn: getTeams,
    enabled: Boolean(workspaceId),
  })
}

export function useCreateTeam(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: {
      name: string
      identifier: string
      description?: string
    }) => createTeam(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] })
      toast.success('Team created')
    },
    onError: () => toast.error('Could not create team'),
  })
}

export function useDeleteTeam(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (teamId: string) => deleteTeam(teamId),
    onSuccess: (_, teamId) => {
      void queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] })
      queryClient.removeQueries({ queryKey: ['team-links', teamId] })
      queryClient.removeQueries({ queryKey: ['team-documents', teamId] })
      queryClient.removeQueries({ queryKey: ['team-members', teamId] })
      queryClient.removeQueries({
        queryKey: ['team-tasks', workspaceId, teamId],
      })
      queryClient.removeQueries({ queryKey: ['team-projects', teamId] })
      toast.success('Team deleted')
    },
    onError: (error) => {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined
      toast.error(
        typeof message === 'string' ? message : 'Could not delete team',
      )
    },
  })
}

export function useGetTeamLinks(teamId: string, enabled = true) {
  return useQuery({
    queryKey: ['team-links', teamId],
    queryFn: () => getTeamLinks(teamId),
    enabled: Boolean(teamId) && enabled,
  })
}

export function useCreateTeamLink(teamId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: { title: string; url: string }) =>
      createTeamLink(teamId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-links', teamId] })
      toast.success('Link added')
    },
    onError: () => toast.error('Could not add link'),
  })
}

export function useGetTeamDocuments(teamId: string, enabled = true) {
  return useQuery({
    queryKey: ['team-documents', teamId],
    queryFn: () => getTeamDocuments(teamId),
    enabled: Boolean(teamId) && enabled,
  })
}

export function useCreateTeamDocument(teamId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: { name: string; content?: string }) =>
      createTeamDocument(teamId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-documents', teamId] })
      toast.success('Document added')
    },
    onError: () => toast.error('Could not add document'),
  })
}

export function useGetTeamMembers(teamId: string, enabled = true) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => getTeamMembers(teamId),
    enabled: Boolean(teamId) && enabled,
  })
}

export function useGetTeamProjects(
  teamId: string,
  page: number,
  limit: number,
  enabled = true,
) {
  return useQuery({
    queryKey: ['team-projects', teamId, page, limit],
    queryFn: () => getTeamProjects(teamId, page, limit),
    enabled: Boolean(teamId) && enabled,
  })
}

export function useAddTeamMembers(teamId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberIds: string[]) => addTeamMembers(teamId, memberIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
      if (result.failed.length) {
        toast.error('Some people could not be added to the team')
      } else {
        toast.success('Team members updated')
      }
    },
    onError: () => toast.error('Could not add team members'),
  })
}

export function useRemoveTeamMember(teamId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => removeTeamMember(teamId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
      toast.success('Member removed from team')
    },
    onError: () => toast.error('Could not remove team member'),
  })
}
