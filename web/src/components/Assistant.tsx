import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GOALS, TABS, TAB_COPY, hasValidInput, type AudioInput as AudioValue, type InputMode } from '../lib/assistant'
import { AUDIO_EXAMPLE } from '../lib/audio'
import { AUDIO_EXAMPLE_TARGET, DEMO_NOTICE, getScenario, isUsingExample, toDemoRequest } from '../lib/demo'
import { useActions, useAppState } from '../lib/StoreProvider'
import { snapshotAssistantDraft, type InputSnapshot } from '../lib/store'
import { validateImage } from '../lib/upload'
import { useDemoGeneration } from '../lib/useDemoGeneration'
import { AudioInput } from './AudioInput'
import { ContinuingBanner } from './ContinuingBanner'
import { ImageInput } from './ImageInput'
import { ChevronIcon, LockIcon, MicIcon, PhotoIcon, TextIcon, WandIcon } from './Icons'
import { Results } from './Results'
import { SegmentedControl } from './SegmentedControl'
import { TestTools } from './TestTools'

interface Props {
  onToast: (message: string) => void
}

const MODES: { id: InputMode; label: ReactNode }[] = [
  { id: 'image', label: <><PhotoIcon size={16} /> Print</> },
  { id: 'text', label: <><TextIcon size={16} /> Texto</> },
  { id: 'audio', label: <><MicIcon size={16} /> Áudio</> },
]

const EMPTY_HELP: Record<InputMode, string> = {
  image: 'Envie um print, cole um texto ou use o exemplo para continuar.',
  text: 'Cole a conversa, escreva um relato ou use o exemplo para continuar.',
  audio: 'Grave ou envie um áudio para continuar.',
}

export function Assistant({ onToast }: Props) {
  // Rascunho e resultado ficam no store em memória: sobrevivem à navegação, somem ao recarregar.
  const draft = useAppState((s) => s.assistantDraft)
  const { updateAssistantDraft: onChange, setResult, setSection } = useActions()
  const [imageError, setImageError] = useState<string | null>(null)
  // Gerar só preenche o resultado atual; histórico só existe ao clicar em "Salvar conversa".
  // A entrada é fotografada no clique em "Gerar" (sem arquivos) e salva junto com o resultado.
  const pendingInput = useRef<InputSnapshot | null>(null)
  const { status, run, retry, failNext, setFailNext, loading } = useDemoGeneration((request) => {
    if (pendingInput.current) setResult('assistant', request, pendingInput.current)
  })

  const copy = TAB_COPY[draft.tab]
  const canGenerate = hasValidInput(draft) && !loading
  const usingExample = isUsingExample(draft)
  const audioExampleHere = draft.tab === AUDIO_EXAMPLE_TARGET.tab

  function generate() {
    if (!hasValidInput(draft) || loading) return
    pendingInput.current = snapshotAssistantDraft(draft)
    run(toDemoRequest(draft))
  }

  function setAudio(next: AudioValue | null) {
    onChange((d) => {
      if (d.audio?.kind === 'own' && d.audio !== next) URL.revokeObjectURL(d.audio.url)
      return { ...d, audio: next }
    })
  }

  function applyExample() {
    // No modo Áudio de "Responder conversa", o exemplo é a transcrição fictícia identificada.
    if (draft.mode === 'audio' && audioExampleHere) {
      const scenario = getScenario(AUDIO_EXAMPLE_TARGET.tab, AUDIO_EXAMPLE_TARGET.goal)
      const hasOwn = draft.audio?.kind === 'own' || (draft.context.trim() !== '' && draft.context.trim() !== scenario.context)
      if (hasOwn && !window.confirm('Substituir seu áudio e o contexto pelo exemplo? O exemplo não tem áudio real.')) return
      setAudio({ kind: 'example', transcript: AUDIO_EXAMPLE.transcript })
      onChange((d) => ({ ...d, goal: AUDIO_EXAMPLE_TARGET.goal, context: scenario.context }))
      return
    }
    const scenario = getScenario(draft.tab, draft.goal)
    const hasOwnText = draft.text.trim() !== '' || draft.context.trim() !== ''
    if (hasOwnText && !usingExample && !window.confirm('Substituir o texto e o contexto que você escreveu pelo exemplo?')) {
      return
    }
    onChange((d) => ({ ...d, mode: 'text', text: scenario.text, context: scenario.context }))
  }

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
      <div className="modes-head">
        <h2 id="assistant-title">Assistente</h2>
      </div>

      <button type="button" className="entry-row" onClick={() => setSection('modes')}>
        <span className="entry-icon" aria-hidden="true">
          <WandIcon size={20} />
        </span>
        <span className="entry-text">
          <span className="entry-title">Modos especiais</span>
          <span className="entry-sub">Date Rápido, Pós-Date, Protocolo Nudes e Sexo Express</span>
        </span>
        <ChevronIcon />
      </button>

      <ContinuingBanner workspace="assistant" />

      <SegmentedControl
        kind="tabs"
        idPrefix="assistant-tab"
        label="Tipo de ajuda"
        options={TABS}
        value={draft.tab}
        onChange={(tab) => onChange((d) => ({ ...d, tab }))}
      />

      <div id="assistant-tab-panel" role="tabpanel" aria-labelledby={`assistant-tab-${draft.tab}`}>
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault()
            generate()
          }}
        >
          <div className="panel-intro-row">
            <p className="panel-intro">{copy.intro}</p>
            <button type="button" className="btn-link" onClick={applyExample}>
              Usar exemplo
            </button>
          </div>

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
            ) : draft.mode === 'audio' ? (
              <>
                <AudioInput
                  audio={draft.audio}
                  hint={copy.audioHint}
                  onChange={setAudio}
                  onUseText={() => onChange((d) => ({ ...d, mode: 'text' }))}
                />
                {!audioExampleHere && draft.audio === null && (
                  <p className="field-help">O exemplo de áudio fica em Responder conversa.</p>
                )}
              </>
            ) : (
              <div className="field">
                <label htmlFor="conversation-text" className="field-label">
                  {copy.textLabel}
                  {usingExample && <span className="tag">Exemplo fictício</span>}
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
            <p className="demo-notice">{DEMO_NOTICE}</p>
            <button type="submit" className="btn-primary" disabled={!canGenerate} aria-describedby="generate-help">
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Gerando…
                </>
              ) : (
                'Gerar sugestões'
              )}
            </button>
            <p id="generate-help" className="privacy-note">
              {hasValidInput(draft) ? (
                <>
                  <LockIcon /> Print, texto e áudio ficam só neste navegador.
                </>
              ) : (
                EMPTY_HELP[draft.mode]
              )}
            </p>
          </div>
        </form>
      </div>

      <Results workspace="assistant" status={status} onRetry={retry} onToast={onToast} />

      <TestTools failNext={failNext} onChange={setFailNext} />
    </section>
  )
}
