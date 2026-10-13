import { useRef, useState } from 'react'
import { ADJUSTMENTS, cardText, type DemoCard, type Version } from '../lib/demo'
import { COPY_FALLBACK_MESSAGE, useCopy } from '../lib/useCopy'
import { CopyButton } from './CopyButton'
import { FeedbackControl } from './FeedbackControl'
import { StarIcon } from './Icons'

interface Props {
  id: string
  tone: string
  card: DemoCard
  recommended: boolean
  reason?: string
  /** Prefixo da chave do feedback; a versão exibida é acrescentada. */
  feedbackKey: string
  onCopied: () => void
}

type Panel = 'none' | 'adjust' | 'why'

export function SuggestionCard({ id, tone, card, recommended, reason, feedbackKey, onCopied }: Props) {
  // Cada card guarda a própria versão: ajustar um nunca toca nos outros.
  const [version, setVersion] = useState<Version>('original')
  const [panel, setPanel] = useState<Panel>('none')
  const [announcement, setAnnouncement] = useState('')
  const textRef = useRef<HTMLParagraphElement>(null)
  const { state: copyState, copy, reset: resetCopy } = useCopy(textRef, onCopied)

  const versionLabel = ADJUSTMENTS.find((a) => a.id === version)?.label

  function choose(next: Version) {
    setVersion(next)
    resetCopy()
    setPanel('none')
    const label = ADJUSTMENTS.find((a) => a.id === next)?.label
    setAnnouncement(next === 'original' ? `${tone}: versão original.` : `${tone}: ajuste "${label}" aplicado.`)
  }

  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? 'none' : p))

  return (
    <article className={`suggestion card${recommended ? ' is-recommended' : ''}`} aria-labelledby={`${id}-tone`}>
      <header className="suggestion-head">
        <h3 id={`${id}-tone`} className="suggestion-tone">
          {tone}
        </h3>
        {recommended && (
          <span className="badge badge-recommended">
            <StarIcon /> Recomendada
          </span>
        )}
      </header>

      <p ref={textRef} key={version} id={`${id}-text`} className="suggestion-text">
        {cardText(card, version)}
      </p>

      {version !== 'original' && (
        <p className="version-row">
          <span className="tag">{versionLabel}</span>
          <button type="button" className="btn-inline" onClick={() => choose('original')}>
            Voltar ao original
          </button>
        </p>
      )}

      {recommended && reason && (
        <p className="suggestion-reason">
          <strong>Recomendada porque:</strong> {reason}
        </p>
      )}

      <div className="suggestion-actions">
        <button
          type="button"
          className="btn-pill"
          aria-expanded={panel === 'adjust'}
          aria-controls={`${id}-adjust`}
          onClick={() => toggle('adjust')}
        >
          Ajustar
        </button>
        <button
          type="button"
          className="btn-pill"
          aria-expanded={panel === 'why'}
          aria-controls={`${id}-why`}
          onClick={() => toggle('why')}
        >
          Por que usar esta?
        </button>
        <CopyButton state={copyState} onClick={copy} describedBy={`${id}-text`} />
      </div>

      {panel === 'adjust' && (
        <div id={`${id}-adjust`} className="adjust-options" role="group" aria-label={`Ajustar mensagem ${tone}`}>
          {ADJUSTMENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className="chip-btn"
              aria-pressed={version === a.id}
              onClick={() => choose(version === a.id ? 'original' : a.id)}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {panel === 'why' && (
        <div id={`${id}-why`} className="why-panel">
          <p>
            <strong>Intenção:</strong> {card.why.intent}
          </p>
          <p>
            <strong>Próximo passo:</strong> {card.why.next}
          </p>
        </div>
      )}

      <p className="copy-fallback" role="alert">
        {copyState === 'failed' && COPY_FALLBACK_MESSAGE}
      </p>

      <FeedbackControl id={id} storageKey={`${feedbackKey}/${version}`} />

      <span className="visually-hidden" aria-live="polite">
        {announcement}
      </span>
    </article>
  )
}
