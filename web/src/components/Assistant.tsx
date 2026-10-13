import { useEffect, useState, type ReactNode } from 'react'
import { GOALS, TABS, TAB_COPY, hasValidInput, type AssistantDraft, type InputMode } from '../lib/assistant'
import { validateImage } from '../lib/upload'
import { ImageInput } from './ImageInput'
import { LockIcon, PhotoIcon, TextIcon } from './Icons'
import { SegmentedControl } from './SegmentedControl'

interface Props {
  draft: AssistantDraft
  onChange: (update: (d: AssistantDraft) => AssistantDraft) => void
  onGenerate: () => void
}

const MODES: { id: InputMode; label: ReactNode }[] = [
  { id: 'image', label: <><PhotoIcon size={16} /> Print</> },
  { id: 'text', label: <><TextIcon size={16} /> Texto</> },
]

export function Assistant({ draft, onChange, onGenerate }: Props) {
  const [imageError, setImageError] = useState<string | null>(null)
  const copy = TAB_COPY[draft.tab]
  const canGenerate = hasValidInput(draft)

  function selectImage(file: File) {
    const error = validateImage(file)
    setImageError(error)
    if (error) return
    const previewUrl = URL.createObjectURL(file)
    onChange((d) => {
      if (d.image) URL.revokeObjectURL(d.image.previewUrl)
      return { ...d, mode: 'image', image: { file, previewUrl } }
    })
  }

  function removeImage() {
    setImageError(null)
    onChange((d) => {
      if (d.image) URL.revokeObjectURL(d.image.previewUrl)
      return { ...d, image: null }
    })
  }

  // Colar um print (⌘V / Ctrl+V) em qualquer lugar da tela. Texto colado segue o fluxo normal.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const file = Array.from(e.clipboardData?.files ?? [])[0]
      if (!file) return
      e.preventDefault()
      selectImage(file)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  })

  return (
    <section className="assistant" aria-labelledby="assistant-title">
      <h2 id="assistant-title" className="visually-hidden">
        Assistente
      </h2>

      <SegmentedControl
        kind="tabs"
        idPrefix="assistant-tab"
        label="Tipo de ajuda"
        options={TABS}
        value={draft.tab}
        onChange={(tab) => onChange((d) => ({ ...d, tab }))}
      />

      <form
        id="assistant-tab-panel"
        role="tabpanel"
        aria-labelledby={`assistant-tab-${draft.tab}`}
        className="panel"
        onSubmit={(e) => {
          e.preventDefault()
          if (canGenerate) onGenerate()
        }}
      >
        <p className="panel-intro">{copy.intro}</p>

        <fieldset className="card">
          <legend className="card-title">Entrada</legend>
          <SegmentedControl
            kind="radio"
            size="small"
            idPrefix="input-mode"
            label="Como enviar"
            options={MODES}
            value={draft.mode}
            onChange={(mode) => onChange((d) => ({ ...d, mode }))}
          />

          {draft.mode === 'image' ? (
            <ImageInput
              image={draft.image}
              error={imageError}
              hint={copy.imageHint}
              onSelect={selectImage}
              onRemove={removeImage}
            />
          ) : (
            <div className="field">
              <label htmlFor="conversation-text" className="field-label">
                {copy.textLabel}
              </label>
              <textarea
                id="conversation-text"
                rows={7}
                value={draft.text}
                placeholder={copy.textPlaceholder}
                onChange={(e) => onChange((d) => ({ ...d, text: e.target.value }))}
              />
            </div>
          )}
        </fieldset>

        <div className="card">
          <div className="field">
            <label htmlFor="extra-context" className="field-label">
              Contexto <span className="optional">opcional</span>
            </label>
            <textarea
              id="extra-context"
              rows={3}
              value={draft.context}
              placeholder="Ex.: a gente se conheceu no app há 3 dias e ela sumiu ontem."
              onChange={(e) => onChange((d) => ({ ...d, context: e.target.value }))}
            />
          </div>
        </div>

        <fieldset className="card">
          <legend className="card-title">Objetivo</legend>
          <div className="chips" role="radiogroup" aria-label="Objetivo">
            {GOALS.map((g) => (
              <label key={g.id} className="chip">
                <input
                  type="radio"
                  name="goal"
                  value={g.id}
                  checked={draft.goal === g.id}
                  onChange={() => onChange((d) => ({ ...d, goal: g.id }))}
                />
                <span>{g.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="actions">
          <button type="submit" className="btn-primary" disabled={!canGenerate} aria-describedby="generate-help">
            Gerar sugestões
          </button>
          <p id="generate-help" className="privacy-note">
            {canGenerate ? (
              <>
                <LockIcon /> Seu print e seu texto ficam só neste navegador.
              </>
            ) : draft.mode === 'image' ? (
              'Envie um print para continuar.'
            ) : (
              'Cole a conversa ou escreva um relato para continuar.'
            )}
          </p>
        </div>
      </form>
    </section>
  )
}
