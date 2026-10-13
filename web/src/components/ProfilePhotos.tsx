import { useRef, useState } from 'react'
import type { ImageSelection } from '../lib/assistant'
import { MAX_PROFILE_PHOTOS } from '../lib/profile'
import { IMAGE_ACCEPT, validateImage } from '../lib/upload'
import { AlertIcon, LockIcon, PlusIcon, XIcon } from './Icons'

interface Props {
  photos: ImageSelection[]
  /** Recebe a lista nova; quem chama não precisa revogar URLs (este componente revoga ao remover). */
  onChange: (photos: ImageSelection[]) => void
}

/** Fotos do perfil para o Robô de Match: até 6, só no navegador (URLs `blob:`), nunca enviadas. */
export function ProfilePhotos({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const left = MAX_PROFILE_PHOTOS - photos.length

  function add(files: File[]) {
    const errs: string[] = []
    const added: ImageSelection[] = []
    for (const file of files) {
      if (added.length >= left) {
        errs.push(`Máximo de ${MAX_PROFILE_PHOTOS} fotos: "${file.name}" ficou de fora.`)
        continue
      }
      const err = validateImage(file)
      if (err) errs.push(`${file.name}: ${err}`)
      else added.push({ file, previewUrl: URL.createObjectURL(file) })
    }
    setErrors(errs)
    if (added.length) onChange([...photos, ...added])
  }

  function remove(index: number) {
    URL.revokeObjectURL(photos[index].previewUrl)
    setErrors([])
    onChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div className="profile-photos">
      <input
        ref={inputRef}
        id="mode-photos"
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="visually-hidden"
        aria-label="Adicionar fotos do perfil"
        aria-describedby="profile-photos-help"
        onChange={(e) => {
          add(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
      <ul className="photo-grid" aria-label="Fotos enviadas">
        {photos.map((p, i) => (
          <li key={p.previewUrl} className="photo-thumb">
            <img src={p.previewUrl} alt={`Foto ${i + 1} do perfil`} />
            <span className="photo-index" aria-hidden="true">
              {i + 1}
            </span>
            <button type="button" className="photo-remove" aria-label={`Remover foto ${i + 1}`} onClick={() => remove(i)}>
              <XIcon size={14} />
            </button>
          </li>
        ))}
        {left > 0 && (
          <li>
            <button type="button" className="photo-add" onClick={() => inputRef.current?.click()}>
              <PlusIcon />
              <span>{photos.length ? 'Adicionar' : 'Adicionar fotos'}</span>
            </button>
          </li>
        )}
      </ul>
      <p id="profile-photos-help" className="field-help with-icon">
        <LockIcon /> Até {MAX_PROFILE_PHOTOS} fotos (PNG, JPEG ou WebP, até 10 MB cada), na ordem do perfil. Ficam só neste
        navegador.
      </p>
      <div className="field-error-list" role="alert">
        {errors.map((e) => (
          <p key={e} className="field-error">
            <AlertIcon />
            {e}
          </p>
        ))}
      </div>
    </div>
  )
}
