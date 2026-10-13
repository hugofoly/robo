import { useEffect, useRef } from 'react'
import { DEMO_NOTICE, OWN_INPUT_MESSAGES, TONES, type DemoRequest } from '../lib/demo'
import type { Generation } from '../lib/useDemoGeneration'
import { FollowUp } from './FollowUp'
import { AlertIcon } from './Icons'
import { SuggestionCard } from './SuggestionCard'

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

  return (
    <section ref={regionRef} className="results" aria-labelledby="results-title" aria-busy={generation.status === 'loading'}>
      <header className="results-head">
        <h2 id="results-title" ref={focusRef} tabIndex={-1}>
          Sugestões
        </h2>
        <span className="badge badge-demo">Demonstração</span>
      </header>
      <p className="results-meta">{request.label}</p>
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

      {generation.status === 'success' && <SuccessBody request={request} runId={generation.runId} onCopied={onCopied} />}
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
  const { content, source } = request

  return (
    <div className="results-body">
      {source !== 'example' && (
        <p className="own-input-note">
          <strong>{OWN_INPUT_MESSAGES[source]}</strong> Para você testar a interface, as mensagens abaixo respondem a um
          cenário de exemplo, não à sua conversa.
        </p>
      )}

      <div className="card reading">
        <h3 className="card-title">Leitura do cenário de exemplo</h3>
        <p className="reading-scenario">{content.summary}</p>
        <p className="reading-text">{content.reading}</p>
      </div>

      <div className="suggestions">
        {TONES.map((t) => (
          <SuggestionCard
            key={`${runId}-${t.id}`}
            id={`suggestion-${t.id}`}
            tone={t.label}
            card={content.cards[t.id]}
            recommended={content.recommended === t.id}
            reason={content.reason}
            feedbackKey={`${request.feedbackKey}/${t.id}`}
            onCopied={onCopied}
          />
        ))}
      </div>

      <FollowUp key={runId} scenario={content} onCopied={onCopied} />
    </div>
  )
}
