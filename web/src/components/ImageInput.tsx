import { useRef, useState, type DragEvent } from 'react'
import { IMAGE_ACCEPT, formatBytes } from '../lib/upload'
import type { ImageSelection } from '../lib/assistant'
import { AlertIcon, PhotoIcon } from './Icons'

interface Props {
  image: ImageSelection | null
  error: string | null
  hint: string
  onSelect: (file: File) => void
  onRemove: () => void
}

export function ImageInput({ image, error, hint, onSelect, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const openPicker = () => inputRef.current?.click()

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onSelect(file)
  }

  return (
    <div className="image-input">
      <input
        ref={inputRef}
        id="print-input"
        type="file"
        accept={IMAGE_ACCEPT}
        className="visually-hidden"
        aria-describedby="print-help print-error"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onSelect(file)
          // Permite escolher o mesmo arquivo de novo depois de remover.
          e.target.value = ''
        }}
      />

      {image ? (
        <figure className="preview">
          <div className="preview-frame">
            <img src={image.previewUrl} alt="Pré-visualização do print enviado" />
          </div>
          <figcaption>
            <span className="preview-name" title={image.file.name}>
              {image.file.name}
            </span>
            <span className="preview-size">{formatBytes(image.file.size)}</span>
          </figcaption>
          <div className="preview-actions">
            <button type="button" className="btn-secondary" onClick={openPicker}>
              Trocar
            </button>
            <button type="button" className="btn-secondary destructive" onClick={onRemove}>
              Remover
            </button>
          </div>
        </figure>
      ) : (
        <label
          htmlFor="print-input"
          className={`dropzone${dragging ? ' is-dragging' : ''}${error ? ' has-error' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className="dropzone-icon">
            <PhotoIcon size={28} />
          </span>
          <span className="dropzone-title">{hint}</span>
          <span className="dropzone-sub">
            <span className="link">Escolher imagem</span>
            <span className="desktop-only">, arraste ou cole o print</span>
          </span>
        </label>
      )}

      <p id="print-help" className="field-help">
        PNG, JPEG ou WebP até 10 MB.
      </p>
      <p id="print-error" className="field-error" role="alert" aria-live="assertive">
        {error && (
          <>
            <AlertIcon />
            {error}
          </>
        )}
      </p>
    </div>
  )
}
