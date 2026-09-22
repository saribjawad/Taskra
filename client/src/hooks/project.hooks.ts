import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProject, getProjects } from '#/service/project.service'

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
