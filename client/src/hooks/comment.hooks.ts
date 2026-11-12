import {
  createComment,
  deleteComment,
  updateComment,
} from '#/service/comment.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      comment,
      attachments,
    }: {
      taskId: string
      comment: string
      attachments?: File[]
    }) => createComment(taskId, comment, attachments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`task-activity-${variables.taskId}`],
      })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      commentId,
    }: {
      taskId: string
      commentId: string
    }) => deleteComment(taskId, commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`task-activity-${variables.taskId}`],
      })
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      comment,
    }: {
      taskId: string
      comment: { id: string; content: string }
    }) => updateComment(taskId, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`task-activity-${variables.taskId}`],
      })
    },
  })
}
