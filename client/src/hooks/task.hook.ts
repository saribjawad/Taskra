import { getTasks } from '#/service/task.service'
import { useQuery } from '@tanstack/react-query'

export const useGetTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks(),
  })
}
