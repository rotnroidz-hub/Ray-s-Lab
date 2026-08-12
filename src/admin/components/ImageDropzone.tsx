import { useCallback, useRef, useState, type DragEvent } from 'react'
import { motion } from 'framer-motion'
import { deleteProductImage, storagePathFromUrl, uploadProductImage } from '../../lib/adminApi'
import { responsiveImage } from '../../lib/image'
import { IconImage, IconTrash, IconUpload } from '../../components/ui/Icons'

interface ImageDropzoneProps {
  value: string[]
  onChange: (next: string[]) => void
  max?: number
}

export function ImageDropzone({ value, onChange, max = 8 }: ImageDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setUploading(true)
      try {
        const room = max - value.length
        const chosen = Array.from(files).slice(0, Math.max(room, 0))
        const uploaded = await Promise.all(chosen.map((f) => uploadProductImage(f)))
        onChange([...value, ...uploaded.map((u) => u.url)].slice(0, max))
      } catch (err) {
        console.error('Upload failed', err)
        window.alert('Upload failed — check that your storage bucket policies allow admin uploads.')
      } finally {
        setUploading(false)
      }
    },
    [max, value, onChange],
  )

  const remove = useCallback(
    async (url: string) => {
      const path = storagePathFromUrl(url)
      if (path) await deleteProductImage(path).catch(() => undefined)
      onChange(value.filter((u) => u !== url))
    },
    [onChange, value],
  )

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload product images"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e: DragEvent) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault()
          setDragging(false)
          void uploadFiles(e.dataTransfer.files)
        }}
        className={
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ' +
          (dragging ? 'border-pine bg-pine-soft' : 'border-ink/20 bg-canvas hover:border-pine/60')
        }
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-canvas-deep text-pine">
          <IconUpload className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-ink">
          {uploading ? 'Uploading…' : 'Drop images here or click to browse'}
        </span>
        <span className="text-xs text-ink-muted">
          JPG, PNG or WebP — {value.length}/{max} added
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void uploadFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {value.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((url, i) => (
            <motion.li
              key={url}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative aspect-square overflow-hidden rounded-xl border border-ink/10"
            >
              <img
                src={responsiveImage(url, 300)}
                alt={`Image ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => void remove(url)}
                aria-label={`Remove image ${i + 1}`}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-ink/60 text-canvas opacity-0 backdrop-blur transition-opacity hover:bg-clay group-hover:opacity-100"
              >
                <IconTrash className="h-3.5 w-3.5" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/60 px-2 py-0.5 text-[10px] font-semibold text-canvas backdrop-blur">
                  Cover
                </span>
              )}
              {!url && <span className="grid h-full w-full place-items-center bg-pine-soft"><IconImage className="h-5 w-5 text-pine" /></span>}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}