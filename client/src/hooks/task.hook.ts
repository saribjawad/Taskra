import {
  getTaskById,
  getTasks,
  type GetTasksParams,
} from '#/service/task.service'
import { useQuery } from '@tanstack/react-query'

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
