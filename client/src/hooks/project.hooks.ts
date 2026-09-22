import { useAuth } from '#/context/auth/auth-hook'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProject,
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

export function useGetProject(workspaceId: string, projectId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: () => getProject(projectId),
    // The detail endpoint selects its workspace from the session.
    enabled: Boolean(projectId) && workspaceId === user?.activeWorkspace,
  })
}
