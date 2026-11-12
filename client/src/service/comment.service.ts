import { ACCEPTED_IMAGE_TYPES } from '#/components/fields/AttachmentField'
import { api } from '#/lib/api'

function appendCommentFiles(formData: FormData, attachments?: File[]) {
  attachments?.forEach((file) => {
    const field = ACCEPTED_IMAGE_TYPES.includes(file.type)
      ? 'images'
      : file.type === 'application/pdf'
        ? 'pdf'
        : 'document'
    formData.append(field, file)
  })
}

export async function createComment(
  taskId: string,
  comment: string,
  attachments?: File[],
) {
  const formData = new FormData()
  formData.append('content', comment)
  appendCommentFiles(formData, attachments)
  await api.post(`tasks/${taskId}/comments`, formData)
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
