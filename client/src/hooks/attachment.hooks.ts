import { getPresignedUrl } from '#/service/attachment.service'
import { useMutation } from '@tanstack/react-query'

export function useGetPresignedUrl() {
  return useMutation({
    mutationFn: (attachmentId: string) => getPresignedUrl(attachmentId),
    onSuccess: (data) => {
      window.open(data.data.url)
    },
  })
}
