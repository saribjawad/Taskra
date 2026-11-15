import { getMe } from '#/service/user.service'
import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

export const useGetMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: (count, error) =>
      (error as AxiosError).response?.status !== 401 && count < 3,
  })
}
