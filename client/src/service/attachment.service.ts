import { api } from '#/lib/api'

interface GetPresignedUrlResponse {
  status: number
  message: string
  success: boolean
  data: {
    url: string
  }
}

export async function getPresignedUrl(
  attachmentId: string,
): Promise<GetPresignedUrlResponse> {
  const resp = await api.get(`/attachment/${attachmentId}`)

  return resp.data
}
