import { useAuth } from '#/context/auth/auth-hook'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProject,
  updateProject,
  addProjectMembers,
  removeProjectMembers,
  getProject,
  getProjects,
} from '#/service/project.service'

export function useGetProjects(
  workspaceId: string,
  page: number,
  limit: number,
) {
  return useQuery({
    queryKey: ['projects', workspaceId, page, limit],
    queryFn: () => getProjects(workspaceId, page, limit),
    enabled: Boolean(workspaceId),
  })
}

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['projects', workspaceId],
      })
    },
  })
}

export function useUpdateProject(workspaceId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof updateProject>[1]) =>
      updateProject(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['project', workspaceId, projectId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['projects', workspaceId],
      })
    },
  })
}

export function useGetProject(workspaceId: string, projectId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: () => getProject(projectId),
    // The detail endpoint selects its workspace from the session.
    enabled: Boolean(projectId) && workspaceId === user?.activeWorkspace,
  })
}

export function useChangeProjectMembers(
  workspaceId: string,
  projectId: string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (change: {
      addedUserIds: string[]
      removedMembershipIds: string[]
    }) => {
      // Each endpoint receives the complete batch, never one request per person.
      const results = await Promise.allSettled([
        ...(change.addedUserIds.length
          ? [addProjectMembers(projectId, change.addedUserIds)]
          : []),
        ...(change.removedMembershipIds.length
          ? [removeProjectMembers(projectId, change.removedMembershipIds)]
          : []),
      ])
      const failed = results.find((result) => result.status === 'rejected')
      if (failed?.status === 'rejected') throw failed.reason
    },
    // Refresh even after partial success so retrying only sends remaining changes.
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: ['project', workspaceId, projectId],
      }),
  })
}
