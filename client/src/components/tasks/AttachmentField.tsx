import { useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { FileText, Paperclip, X } from 'lucide-react'
import { cn } from '#/lib/utils'

export const MAX_IMAGES = 3
export const MAX_DOCUMENTS = 2
export const MAX_FILES = MAX_IMAGES + MAX_DOCUMENTS
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ACCEPTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
export const ACCEPTED_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_DOCUMENT_TYPES,
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Cache object URLs per File reference so we don't regenerate them on every render
const previewCache = new WeakMap<File, string>()

function getPreviewUrl(file: File) {
  let url = previewCache.get(file)
  if (!url) {
    url = URL.createObjectURL(file)
    previewCache.set(file, url)
  }
  return url
}

interface AttachmentFieldProps {
  value: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
  error?: string
}

function AttachmentField({
  value,
  onChange,
  disabled,
  error,
}: AttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Revoke object URLs on unmount to avoid leaking memory
  useEffect(() => {
    return () => {
      value.forEach((file) => {
        const url = previewCache.get(file)
        if (url) {
          URL.revokeObjectURL(url)
          previewCache.delete(file)
        }
      })
    }
  }, [])

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return

    onChange([...value, ...selected])
    // reset so selecting the same file twice still fires onChange
    e.target.value = ''
  }

  function handleRemove(index: number) {
    const removed = value[index]
    const url = previewCache.get(removed)
    if (url) {
      URL.revokeObjectURL(url)
      previewCache.delete(removed)
    }
    onChange(value.filter((_, i) => i !== index))
  }

  const reachedLimit = value.length >= MAX_FILES

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || reachedLimit}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="size-3.5" />
          Attach files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          disabled={disabled}
          onChange={handleFilesSelected}
        />
      </div>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((file, index) => {
            const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type)
            return (
              <li
                key={`${file.name}-${file.lastModified}-${index}`}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border border-input',
                  'bg-transparent px-2 py-1 text-xs dark:bg-input/30',
                )}
              >
                {isImage ? (
                  <img
                    src={getPreviewUrl(file)}
                    alt={file.name}
                    className="size-4 rounded-sm object-cover"
                  />
                ) : (
                  <FileText className="size-3.5 text-muted-foreground" />
                )}
                <span className="max-w-35 truncate">{file.name}</span>
                <span className="text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemove(index)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Up to {MAX_IMAGES} images (JPEG, PNG, WEBP) and {MAX_DOCUMENTS} document
        (PDF, DOC, DOCX). 5MB max per file.
      </p>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default AttachmentField
