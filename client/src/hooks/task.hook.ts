import { useAuth } from '#/context/auth/auth-hook'
import { useParams } from '@tanstack/react-router'
import {
  createTask,
  deleteTask,
  getTaskActivities,
  getTaskById,
  getTasks,
  markTaskAsCompleted,
  updateTask,
  type CreateTaskParams,
  type GetTasksParams,
  type UpdateTaskPayload,
} from '#/service/task.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

      // TODO: show the toast
      console.log('Successfully updated the task')
    },
  })
}

export const useGetTaskActivity = (taskId: string) => {
  return useQuery({
    queryKey: [`task-activity-${taskId}`],
    queryFn: () => getTaskActivities(taskId),
    enabled: !!taskId,
  })
}
