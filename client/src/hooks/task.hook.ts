import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  type CreateTaskParams,
  type GetTasksParams,
} from '#/service/task.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useGetTasks = ({
  page = 1,
  limit = 10,
  filter,
}: GetTasksParams) => {
  return useQuery({
    queryKey: [`${filter}-tasks`],
    queryFn: () => getTasks({ filter, page, limit }),
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

// deleteTask

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
