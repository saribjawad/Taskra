import { api } from '#/lib/api'

export async function createComment(taskId: string, comment: string) {
  await api.post(`tasks/${taskId}/comments`, {
    content: comment,
  })
}

export async function deleteComment(taskId: string, commentId: string) {
  await api.delete(`tasks/${taskId}/comments/${commentId}`)
}

export async function updateComment(
  taskId: string,
  comment: { id: string; content: string },
) {
  await api.patch(`tasks/${taskId}/comments/${comment.id}`, {
    content: comment.content,
  })
}
