import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GOALS, TABS, TAB_COPY, hasValidInput, type AssistantDraft, type InputMode } from '../lib/assistant'
import { DEMO_NOTICE, getScenario, isUsingExample, toDemoRequest, type DemoRequest } from '../lib/demo'
import { validateImage } from '../lib/upload'
import { ImageInput } from './ImageInput'
import { LockIcon, PhotoIcon, TextIcon } from './Icons'
import { Results, type Generation } from './Results'
import { SegmentedControl } from './SegmentedControl'

/** Duração do carregamento simulado. Nenhuma requisição é feita. */
const SIMULATED_DELAY_MS = 1400

interface Props {
  draft: AssistantDraft
  onChange: (update: (d: AssistantDraft) => AssistantDraft) => void
  onToast: (message: string) => void
}

const MODES: { id: InputMode; label: ReactNode }[] = [
  { id: 'image', label: <><PhotoIcon size={16} /> Print</> },
  { id: 'text', label: <><TextIcon size={16} /> Texto</> },
]

export function Assistant({ draft, onChange, onToast }: Props) {
  const [imageError, setImageError] = useState<string | null>(null)
  // O resultado vive só enquanto o Assistente está aberto: gerar não cria histórico.
  const [generation, setGeneration] = useState<Generation>({ status: 'idle' })
  const [failNext, setFailNext] = useState(false)
  const inFlight = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  const runId = useRef(0)

  const copy = TAB_COPY[draft.tab]
  const loading = generation.status === 'loading'
  const canGenerate = hasValidInput(draft) && !loading
  const usingExample = isUsingExample(draft)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function run(request: DemoRequest) {
    // Trava síncrona: um segundo clique antes do re-render não inicia outra geração.
    if (inFlight.current) return
    inFlight.current = true
    const shouldFail = failNext
    if (shouldFail) setFailNext(false)
    setGeneration({ status: 'loading', request })
    timer.current = window.setTimeout(() => {
      inFlight.current = false
      runId.current += 1
      setGeneration(shouldFail ? { status: 'error', request } : { status: 'success', request, runId: runId.current })
    }, SIMULATED_DELAY_MS)
  }

  function generate() {
    if (!hasValidInput(draft)) return
    run(toDemoRequest(draft))
  }

  function retry() {
    if (generation.status === 'error') run(generation.request)
  }

  function applyExample() {
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
                <LockIcon /> Seu print e seu texto ficam só neste navegador.
              </>
            ) : draft.mode === 'image' ? (
              'Envie um print, cole um texto ou use o exemplo para continuar.'
            ) : (
              'Cole a conversa, escreva um relato ou use o exemplo para continuar.'
            )}
          </p>
        </div>
      </form>

      <Results generation={generation} onRetry={retry} onCopied={() => onToast('Mensagem copiada.')} />

      <details className="test-tools">
        <summary>Ferramentas de teste</summary>
        <label className="toggle-row">
          <input type="checkbox" checked={failNext} onChange={(e) => setFailNext(e.target.checked)} />
          <span>Simular erro na próxima geração</span>
        </label>
      </details>
    </section>
  )
}
