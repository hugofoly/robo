import { useEffect, useRef } from 'react'
import { useActions, useAppState } from '../lib/StoreProvider'
import type { InputSnapshot, WorkspaceId } from '../lib/store'
import { ContinuingBanner } from './ContinuingBanner'
import { DEMO_NOTICE } from '../lib/demo'
import {
  MODES,
  POST_DATE_PATHS,
  getMode,
  getModeExampleValues,
  hasOwnModeInput,
  isModeExample,
  isModeValid,
  toModeRequest,
  type ModeDraft,
  type ModeId,
} from '../lib/modes'
import { useDemoGeneration } from '../lib/useDemoGeneration'
import { BackIcon, ChevronIcon, ShieldIcon } from './Icons'
import { Results } from './Results'
import { SegmentedControl } from './SegmentedControl'
import { TestTools } from './TestTools'

export function SpecialModes({ onToast }: { onToast: (message: string) => void }) {
  const openMode = useAppState((s) => s.openMode)
  const drafts = useAppState((s) => s.modeDrafts)
  const { setOpenMode: onOpen, updateModeDraft } = useActions()

  if (openMode) {
    return (
      <ModeView
        key={openMode}
        mode={openMode}
        draft={drafts[openMode]}
        onChange={(u) => updateModeDraft(openMode, u)}
        onBack={() => onOpen(null)}
        onToast={onToast}
      />
    )
  }

  return (
    <section className="modes" aria-labelledby="modes-title">
      <div className="modes-head">
        <h2 id="modes-title">Modos especiais</h2>
        <span className="badge">Liberados no Beta</span>
      </div>
      <p className="panel-intro">Fluxos curtos para momentos específicos. Todos usam exemplos locais nesta versão.</p>
      <ul className="mode-list">
        {MODES.map((m) => (
          <li key={m.id}>
            <button type="button" className="mode-row" onClick={() => onOpen(m.id)}>
              <span className="mode-row-text">
                <span className="mode-row-title">{m.title}</span>
                <span className="mode-row-sub">{m.tagline}</span>
              </span>
              <ChevronIcon />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface ViewProps {
  mode: ModeId
  draft: ModeDraft
  onChange: (update: (d: ModeDraft) => ModeDraft) => void
  onBack: () => void
  onToast: (message: string) => void
}

function ModeView({ mode, draft, onChange, onBack, onToast }: ViewProps) {
  const def = getMode(mode)
  const workspace: WorkspaceId = `mode:${mode}`
  const { setResult } = useActions()
  // Entrada fotografada no clique em "Gerar"; o resultado vai para o store (sem histórico até salvar).
  const pendingInput = useRef<InputSnapshot | null>(null)
  const { status, run, retry, failNext, setFailNext, loading } = useDemoGeneration((request) => {
    if (pendingInput.current) setResult(workspace, request, pendingInput.current)
  })
  const titleRef = useRef<HTMLHeadingElement>(null)
  const valid = isModeValid(def, draft)
  const usingExample = isModeExample(def, draft)

  useEffect(() => {
    window.scrollTo({ top: 0 })
    titleRef.current?.focus({ preventScroll: true })
  }, [])

  function applyExample() {
    if (hasOwnModeInput(def, draft) && !window.confirm('Substituir o que você escreveu pelo exemplo?')) return
    const values = getModeExampleValues(mode, draft.path)
    onChange((d) => ({ ...d, values: { ...values } }))
  }

  function setValue(id: string, value: string) {
    onChange((d) => ({ ...d, values: { ...d.values, [id]: value } }))
  }

  return (
    <section className="mode-view" aria-labelledby="mode-title">
      <button type="button" className="btn-back" onClick={onBack}>
        <BackIcon /> Modos especiais
      </button>
      <div className="modes-head">
        <h2 id="mode-title" ref={titleRef} tabIndex={-1}>
          {def.title}
        </h2>
        <span className="badge">Beta</span>
      </div>

      <ContinuingBanner workspace={workspace} />

      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid || loading) return
          pendingInput.current = { kind: 'mode', mode, draft: { ...draft, values: { ...draft.values } } }
          run(toModeRequest(def, draft))
        }}
      >
        <div className="panel-intro-row">
          <p className="panel-intro">{def.description}</p>
          <button type="button" className="btn-link" onClick={applyExample}>
            Usar exemplo
          </button>
        </div>

        {def.guidelines && (
          <div className="guidelines" role="note">
            <p className="guidelines-title">
              <ShieldIcon /> Combinado deste modo
            </p>
            <ul>
              {def.guidelines.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        )}

        {mode === 'post-date' && (
          <fieldset className="card">
            <legend className="card-title">Caminho</legend>
            <SegmentedControl
              kind="radio"
              size="small"
              idPrefix="post-date-path"
              label="Caminho do pós-date"
              options={POST_DATE_PATHS}
              value={draft.path}
              onChange={(path) => onChange((d) => ({ ...d, path }))}
            />
          </fieldset>
        )}

        <div className="card mode-fields">
          {def.fields.map((f) => (
            <div key={f.id} className="field">
              <label htmlFor={`mode-${f.id}`} className="field-label">
                {f.label}
                {!f.required && <span className="optional">opcional</span>}
                {usingExample && f === def.fields[0] && <span className="tag">Exemplo fictício</span>}
              </label>
              {f.kind === 'textarea' ? (
                <textarea
                  id={`mode-${f.id}`}
                  rows={4}
                  value={draft.values[f.id] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => setValue(f.id, e.target.value)}
                />
              ) : (
                <input
                  id={`mode-${f.id}`}
                  type="text"
                  className="text-input"
                  value={draft.values[f.id] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => setValue(f.id, e.target.value)}
                />
              )}
            </div>
          ))}

          {def.adultConfirm && (
            <label className="toggle-row consent-row">
              <input type="checkbox" checked={draft.adult} onChange={(e) => onChange((d) => ({ ...d, adult: e.target.checked }))} />
              <span>Confirmo que eu e a outra pessoa somos maiores de 18 anos.</span>
            </label>
          )}
        </div>

        <div className="actions">
          <p className="demo-notice">{DEMO_NOTICE}</p>
          <button type="submit" className="btn-primary" disabled={!valid || loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" /> Gerando…
              </>
            ) : (
              'Gerar sugestões'
            )}
          </button>
          {!valid && (
            <p className="privacy-note">
              {def.adultConfirm && !draft.adult
                ? 'Preencha o campo e confirme a maioridade para continuar.'
                : 'Preencha os campos ou use o exemplo para continuar.'}
            </p>
          )}
        </div>
      </form>

      <Results workspace={workspace} status={status} onRetry={retry} onToast={onToast} />
      <TestTools failNext={failNext} onChange={setFailNext} />
    </section>
  )
}
