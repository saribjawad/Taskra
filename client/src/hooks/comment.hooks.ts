import { createComment, deleteComment } from '#/service/comment.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      comment,
    }: {
      taskId: string
      comment: string
    }) => createComment(taskId, comment),
    onSuccess: (_, variables) => {
      console.log('Commented successfully')
      queryClient.invalidateQueries({ queryKey: [`task-${variables.taskId}`] })
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
      console.log('Deleted successfully')
      queryClient.invalidateQueries({ queryKey: [`task-${variables.taskId}`] })
    },
  })
}
