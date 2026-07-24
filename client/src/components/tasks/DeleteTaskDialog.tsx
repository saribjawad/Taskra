import type { Dispatch, SetStateAction } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { TriangleAlert } from 'lucide-react'

interface DeleteTaskDialogProps {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  onDelete: () => void
  isDeleting?: boolean
}

function DeleteTaskDialog({
  open,
  onOpenChange,
  onDelete,
  isDeleting = false,
}: DeleteTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <TriangleAlert className="h-6 w-6 text-destructive" />
          </div>

          <DialogTitle className="text-lg">Delete this task?</DialogTitle>

          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The task and all of its comments will
            be permanently deleted.
          </p>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>

          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={onDelete}
          >
            {isDeleting ? 'Deleting...' : 'Delete task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteTaskDialog
