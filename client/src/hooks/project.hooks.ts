import { useAuth } from '#/context/auth/auth-hook'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  createProject,
  updateProject,
  addProjectMembers,
  removeProjectMembers,
  getProject,
  getProjects,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  getProjectTasks,
  deleteProject,
} from '#/service/project.service'

type ProjectTaskFilters = Parameters<typeof getProjectTasks>[2]
type MilestonePayload = Parameters<typeof createProjectMilestone>[1]
type MilestoneUpdatePayload = Parameters<typeof updateProjectMilestone>[2]

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

export function useDeleteProject(workspaceId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['projects', workspaceId],
      })
      queryClient.removeQueries({
        queryKey: ['project', workspaceId, projectId],
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

export function useGetProjectTasks(
  projectId: string,
  filters: ProjectTaskFilters = {},
) {
  return useInfiniteQuery({
    queryKey: ['project-tasks', projectId, filters],
    initialPageParam: undefined as { time: string; id: string } | undefined,
    queryFn: ({ pageParam }) => getProjectTasks(projectId, pageParam, filters),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.cursor
        ? { time: lastPage.cursor.time, id: lastPage.cursor.id }
        : undefined,
    enabled: Boolean(projectId),
  })
}

export function useProjectMilestoneActions(
  workspaceId: string,
  projectId: string,
) {
  const queryClient = useQueryClient()
  const onSuccess = () =>
    queryClient.invalidateQueries({
      queryKey: ['project', workspaceId, projectId],
    })

  return {
    create: useMutation({
      mutationFn: (payload: MilestonePayload) =>
        createProjectMilestone(projectId, payload),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({
        milestoneId,
        payload,
      }: {
        milestoneId: string
        payload: MilestoneUpdatePayload
      }) => updateProjectMilestone(projectId, milestoneId, payload),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (milestoneId: string) =>
        deleteProjectMilestone(projectId, milestoneId),
      onSuccess,
    }),
  }
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
