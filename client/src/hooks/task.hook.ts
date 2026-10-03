import { useAuth } from '#/context/auth/auth-hook'
import { useParams } from '@tanstack/react-router'
import {
  createTask,
  connectTaskToProject,
  deleteTask,
  getTaskActivities,
  getTaskById,
  getTasks,
  markTaskAsCompleted,
  updateTask,
} from '#/service/task.service'
import type {
  CreateTaskParams,
  GetTasksParams,
  UpdateTaskPayload,
} from '#/service/task.service'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

export function useConnectTaskToProject(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof connectTaskToProject>[1]) =>
      connectTaskToProject(taskId, payload),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [`task-${taskId}`] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['project-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['project-task-progress'] }),
      ]),
  })
}

export const useGetTasks = ({
  page = 1,
  limit = 10,
  label,
  priority,
  status,
  search,
  filter,
}: GetTasksParams) => {
  const { workspaceId } = useParams({ strict: false })
  const { user } = useAuth()

  return useQuery({
    queryKey: [
      'tasks',
      workspaceId,
      filter,
      page,
      limit,
      label,
      priority,
      status,
      search,
    ],
    // The API selects the workspace from the session cookie, not the URL.
    enabled: !!workspaceId && workspaceId === user?.activeWorkspace,
    queryFn: () =>
      getTasks({ filter, page, limit, label, priority, status, search }),
  })
}

export const useGetTaskById = ({ taskId }: { taskId: string }) => {
  return useQuery({
    queryKey: [`task-${taskId}`],
    queryFn: () => getTaskById(taskId),
  })
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateTaskParams) => createTask(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate(query) {
          const queryKeys = query.queryKey.join('')

          if (queryKeys.includes('tasks')) {
            return true
          } else {
            return false
          }
        },
      })
      queryClient.invalidateQueries({ queryKey: ['project-task-progress'] })

      // TODO: show the toast
      console.log('Successfully created the task')
    },
  })
}

export const useMarkTaskAsComplete = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => markTaskAsCompleted(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({
        queryKey: [`task-${taskId}`],
      })
      queryClient.invalidateQueries({
        queryKey: [`task-activity-${taskId}`],
      })
      queryClient.invalidateQueries({ queryKey: ['project-task-progress'] })

      // TODO: show the toast
      console.log('Successfully marked task as completed')
    },
  })
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate(query) {
          const queryKeys = query.queryKey.join('')

          if (queryKeys.includes('tasks')) {
            return true
          } else {
            return false
          }
        },
      })
      queryClient.invalidateQueries({ queryKey: ['project-task-progress'] })

      // TODO: show the toast
      console.log('Successfully deleted the task')
    },
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string
      payload: UpdateTaskPayload
    }) => updateTask(taskId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`task-${variables.taskId}`],
      })
      queryClient.invalidateQueries({
        queryKey: [`task-activity-${variables.taskId}`],
      })
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      })
      queryClient.invalidateQueries({ queryKey: ['project-task-progress'] })

      // TODO: show the toast
      console.log('Successfully updated the task')
    },
  })
}

export const useGetTaskActivity = (taskId: string) => {
  return useInfiniteQuery({
    queryKey: [`task-activity-${taskId}`],
    initialPageParam: undefined as { time: string; id: string } | undefined,
    queryFn: ({ pageParam }) => getTaskActivities(taskId, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.cursor
        ? { time: lastPage.cursor.time, id: lastPage.cursor.id }
        : undefined,
    enabled: !!taskId,
  })
}
