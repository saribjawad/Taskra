import { useMemo } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/shadcn'
import { type Block } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/shadcn/style.css'
import '../../styles.css'

interface TaskDescriptionViewerProps {
  value: string
  className?: string
}

function isEmptyContent(blocks?: Block[]) {
  if (!blocks || blocks.length === 0) return true
  return blocks.every((block) => {
    const content = (block as { content?: unknown }).content
    return !content || (Array.isArray(content) && content.length === 0)
  })
}

function TaskDescriptionViewer({
  value,
  className,
}: TaskDescriptionViewerProps) {
  const initialContent = useMemo<Block[] | undefined>(() => {
    if (!value) return undefined
    try {
      return JSON.parse(value) as Block[]
    } catch {
      return undefined
    }
  }, [value])

  // Read-only view, no dictionary/placeholder overrides needed since
  // there's nothing to type here.
  const editor = useCreateBlockNote({
    initialContent,
  })

  if (isEmptyContent(initialContent)) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No description provided.
      </p>
    )
  }

  return (
    <BlockNoteView
      className={className}
      theme="dark"
      editor={editor}
      editable={false}
      sideMenu={false}
      filePanel={false}
      tableHandles={false}
      emojiPicker={false}
      comments={false}
      slashMenu={false}
      formattingToolbar={false}
      linkToolbar={false}
    />
  )
}

export default TaskDescriptionViewer
