import { useMemo } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/shadcn'
import { en } from '@blocknote/core/locales'
import type { Block } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/shadcn/style.css'
import '../../styles.css'

interface TaskDescriptionEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

function TaskDescriptionEditor({
  value,
  onChange,
  disabled,
  className,
}: TaskDescriptionEditorProps) {
  const initialContent = useMemo<Block[] | undefined>(() => {
    if (!value) return undefined
    try {
      return JSON.parse(value) as Block[]
    } catch {
      return undefined
    }
  }, []) // only used on first mount

  const locale = en

  const editor = useCreateBlockNote({
    initialContent,
    // override the placeholder
    dictionary: {
      ...locale,
      placeholders: {
        ...locale.placeholders,
        emptyDocument: 'Add description',
        default: 'Add description',
        heading: '',
      },
    },
  })

  return (
    <div className={className}>
      <BlockNoteView
        theme="dark"
        editor={editor}
        sideMenu={false}
        editable={!disabled}
        filePanel={false}
        tableHandles={false}
        emojiPicker={false}
        comments={false}
        slashMenu={false}
        onChange={() => {
          onChange(JSON.stringify(editor.document))
        }}
      />
    </div>
  )
}

export default TaskDescriptionEditor
