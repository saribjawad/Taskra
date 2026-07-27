import { api } from '#/lib/api'

export async function createComment(taskId: string, comment: string) {
  await api.post(`tasks/${taskId}/comments`, {
    content: comment,
  })
}
