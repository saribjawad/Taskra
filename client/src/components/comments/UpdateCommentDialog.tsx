import { useEffect, type Dispatch, type SetStateAction } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { X } from 'lucide-react'
import z from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field'
import { Textarea } from '../ui/textarea'

interface UpdateCommentDialogProps {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  isUpdating: boolean
  onUpdate: (content: string) => void
  comment: {
    content: string
  }
}

const UpdateCommentFormSchema = z.object({
  content: z.string('Invalid comment').trim().min(1, 'Comment is required'),
})

export type UpdateCommentFormPayload = z.infer<typeof UpdateCommentFormSchema>

function UpdateCommentDialog({
  isUpdating,
  onOpenChange,
  onUpdate,
  open,
  comment,
}: UpdateCommentDialogProps) {
  const { handleSubmit, control, reset } = useForm({
    resolver: zodResolver(UpdateCommentFormSchema),
    defaultValues: {
      content: comment?.content,
    },
  })

  function onSubmit(data: UpdateCommentFormPayload) {
    onUpdate(data.content)
    reset(data)
  }

  useEffect(() => {
    if (open && comment) {
      reset({ content: comment.content })
    }
  }, [open, comment, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="min-w-[35vw]">
        {/* Header */}
        <DialogHeader>
          <div className="w-full flex items-center justify-between">
            {/* Title */}
            <DialogTitle>Edit comment</DialogTitle>

            {/* Button */}
            <div>
              <DialogClose asChild>
                <Button variant="ghost" type="button" size="icon-sm">
                  <X />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="content"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Comment</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Leave a comment..."
                    autoComplete="off"
                    className="h-32"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>

            {/* TODO: add proper spinner and disabled fields */}
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default UpdateCommentDialog
