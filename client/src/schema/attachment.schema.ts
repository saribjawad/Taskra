import {
  ACCEPTED_DOCUMENT_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_DOCUMENTS,
  MAX_FILE_SIZE,
  MAX_IMAGES,
} from '#/components/fields/AttachmentField'
import z from 'zod'

/**
 * `existingCounts` lets callers (like the edit dialog) fold already-saved
 * attachments into the MAX_IMAGES / MAX_DOCUMENTS limits.
 */
export function createAttachmentsSchema(
  existingCounts: { images: number; documents: number } = {
    images: 0,
    documents: 0,
  },
) {
  return z
    .array(z.instanceof(File))
    .optional()
    .default([])
    .superRefine((files, ctx) => {
      if (!files || files.length === 0) return

      const images = files.filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type))
      const documents = files.filter((f) =>
        ACCEPTED_DOCUMENT_TYPES.includes(f.type),
      )
      const invalid = files.filter(
        (f) =>
          !ACCEPTED_IMAGE_TYPES.includes(f.type) &&
          !ACCEPTED_DOCUMENT_TYPES.includes(f.type),
      )

      if (invalid.length > 0) {
        ctx.addIssue({
          code: 'custom',
          message: `${invalid.map((f) => f.name).join(', ')}: unsupported file type`,
        })
      }
      if (images.length + existingCounts.images > MAX_IMAGES) {
        ctx.addIssue({
          code: 'custom',
          message: `You can attach a maximum of ${MAX_IMAGES} images`,
        })
      }
      if (documents.length + existingCounts.documents > MAX_DOCUMENTS) {
        ctx.addIssue({
          code: 'custom',
          message: `You can attach a maximum of ${MAX_DOCUMENTS} document`,
        })
      }
      files.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          ctx.addIssue({
            code: 'custom',
            message: `${file.name} exceeds the 5MB size limit`,
          })
        }
      })
    })
}

// Backwards-compatible default: used wherever there are no existing
// attachments to fold in (e.g. the create-task dialog).
export const attachmentsSchema = createAttachmentsSchema()
