import { useEffect, useRef } from 'react'
import { GOALS, TABS } from '../lib/assistant'
import { DEMO_NOTICE, TONES, getScenario, type DemoRequest } from '../lib/demo'
import { AlertIcon } from './Icons'
import { SuggestionCard } from './SuggestionCard'

export type Generation =
  | { status: 'idle' }
  | { status: 'loading'; request: DemoRequest }
  | { status: 'success'; request: DemoRequest; runId: number }
  | { status: 'error'; request: DemoRequest }

interface Props {
  generation: Generation
  onRetry: () => void
  onCopied: () => void
}

export function Results({ generation, onRetry, onCopied }: Props) {
  const regionRef = useRef<HTMLElement>(null)
  const focusRef = useRef<HTMLHeadingElement>(null)

  // Leva o foco (e a rolagem) para o resultado ou para o erro assim que chegam.
  useEffect(() => {
    if (generation.status === 'loading') {
      regionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (generation.status === 'success' || generation.status === 'error') {
      focusRef.current?.focus({ preventScroll: true })
      regionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [generation])

  if (generation.status === 'idle') return null

  const { request } = generation
  const tabLabel = TABS.find((t) => t.id === request.tab)?.label
  const goalLabel = GOALS.find((g) => g.id === request.goal)?.label

  return (
    <section ref={regionRef} className="results" aria-labelledby="results-title" aria-busy={generation.status === 'loading'}>
      <header className="results-head">
        <h2 id="results-title" ref={focusRef} tabIndex={-1}>
          Sugestões
        </h2>
        <span className="badge badge-demo">Demonstração</span>
      </header>
      <p className="results-meta">
        {tabLabel} · {goalLabel}
      </p>
      <p className="demo-notice">{DEMO_NOTICE}</p>

      {generation.status === 'loading' && <Loading />}

      {generation.status === 'error' && (
        <div className="card error-card" role="alert">
          <div className="error-title">
            <AlertIcon size={20} />
            Não foi possível gerar as sugestões.
          </div>
          <p>Falha simulada pelo controle de teste. Sua entrada continua aqui, é só tentar de novo.</p>
          <button type="button" className="btn-secondary" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      )}

      {generation.status === 'success' && (
        <SuccessBody request={request} runId={generation.runId} onCopied={onCopied} />
      )}
    </section>
  )
}

function Loading() {
  return (
    <div className="loading">
      <p className="loading-label" role="status">
        <span className="spinner" aria-hidden="true" /> Montando as sugestões de exemplo…
      </p>
      <div className="card skeleton" aria-hidden="true">
        <span className="sk-line w-40" />
        <span className="sk-line" />
        <span className="sk-line w-70" />
      </div>
      {TONES.map((t) => (
        <div key={t.id} className="card skeleton" aria-hidden="true">
          <span className="sk-line w-25" />
          <span className="sk-line" />
          <span className="sk-line w-60" />
        </div>
      ))}
    </div>
  )
}

function SuccessBody({ request, runId, onCopied }: { request: DemoRequest; runId: number; onCopied: () => void }) {
  const scenario = getScenario(request.tab, request.goal)
  const ownInput = request.source !== 'example'

  return (
    <div className="results-body">
      {ownInput && (
        <p className="own-input-note">
          <strong>{request.source === 'own-image' ? 'Seu print não foi analisado.' : 'Seu texto não foi analisado.'}</strong> Para você
          testar a interface, as mensagens abaixo respondem a um cenário de exemplo, não à sua conversa.
        </p>
      )}

      <div className="card reading">
        <h3 className="card-title">Leitura do cenário de exemplo</h3>
        <p className="reading-scenario">{scenario.summary}</p>
        <p className="reading-text">{scenario.reading}</p>
      </div>

      <div className="suggestions">
        {TONES.map((t) => (
          <SuggestionCard
            key={`${runId}-${t.id}`}
            id={`suggestion-${t.id}`}
            tone={t.label}
            text={scenario.messages[t.id]}
            recommended={scenario.recommended === t.id}
            reason={scenario.reason}
            onCopied={onCopied}
          />
        ))}
      </div>
    </div>
  )
}
