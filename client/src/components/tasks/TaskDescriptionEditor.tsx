import { useMemo } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/shadcn'
import { en } from '@blocknote/core/locales'
import { type Block } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/shadcn/style.css'
import '../../styles.css'

interface TaskDescriptionEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function TaskDescriptionEditor({
  value,
  onChange,
  disabled,
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
    <div>
      <BlockNoteView
        theme="dark"
        editor={editor}
        sideMenu={false}
        editable={!disabled}
        filePanel={false}
        tableHandles={false}
        emojiPicker={false}
        comments={false}
        onChange={() => {
          onChange(JSON.stringify(editor.document))
        }}
      />
    </div>
  )
}

export default TaskDescriptionEditor

// /* === shadcn Input parity for BlockNote === */

// .bn-input .bn-container {
//   --bn-colors-editor-background: transparent;
//   --bn-colors-editor-text: var(--foreground);

//   width: 100% !important;
//   min-width: 0 !important;
//   border-radius: var(--radius-lg, 0.5rem) !important;
//   border: 1px solid var(--input) !important;
//   background-color: transparent !important;
//   transition:
//     color 0.15s,
//     background-color 0.15s,
//     border-color 0.15s,
//     box-shadow 0.15s !important;
//   outline: none !important;
// }

// .dark .bn-input .bn-container {
//   background-color: color-mix(
//     in oklab,
//     var(--input) 30%,
//     transparent
//   ) !important;
// }

// /* focus ring, same as focus-visible:border-ring focus-visible:ring-3 ring-ring/50 */
// .bn-input .bn-container:focus-within {
//   border-color: var(--ring) !important;
//   box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent) !important;
// }

// /* disabled state, matches disabled:bg-input/50 disabled:opacity-50 */
// .bn-input-disabled .bn-container {
//   pointer-events: none !important;
//   cursor: not-allowed !important;
//   opacity: 0.5 !important;
// }
// .dark .bn-input-disabled .bn-container {
//   background-color: color-mix(
//     in oklab,
//     var(--input) 80%,
//     transparent
//   ) !important;
// }

// /* strip BlockNote's own chrome so the wrapper above is the only visible border/bg */
// .bn-input .bn-editor {
//   background: transparent !important;
//   border: none !important;
//   box-shadow: none !important;
//   outline: none !important;
//   padding: 0.25rem 0.625rem !important; /* py-1 px-2.5, matches Input */
//   min-height: 14rem !important; /* ~ min-h-56 */
//   max-height: 550px !important;
//   overflow: scroll !important;
//   font-size: 1rem !important; /* text-base */
// }

// @media (min-width: 768px) {
//   .bn-input .bn-editor {
//     font-size: 0.875rem !important; /* md:text-sm */
//   }
// }

// /* placeholder color to match placeholder:text-muted-foreground */
// .bn-input .bn-inline-content.is-empty::before,
// .bn-input [data-placeholder]::before {
//   color: var(--muted-foreground) !important;
//   opacity: 1 !important;
// }
