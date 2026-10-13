import { REASONS } from '../lib/feedback'
import { useActions, useAppState } from '../lib/StoreProvider'
import { ThumbDownIcon, ThumbUpIcon } from './Icons'

export function FeedbackControl({ id, storageKey }: { id: string; storageKey: string }) {
  const feedback = useAppState((s) => s.feedback[storageKey] ?? null)
  const { updateFeedback } = useActions()
  const update = (action: Parameters<typeof updateFeedback>[1]) => updateFeedback(storageKey, action)

  return (
    <div className="feedback">
      <div className="feedback-row" role="group" aria-labelledby={`${id}-fb-label`}>
        <span id={`${id}-fb-label`} className="feedback-label">
          Você usaria?
        </span>
        <button
          type="button"
          className="fb-btn"
          aria-pressed={feedback?.verdict === 'use'}
          onClick={() => update({ verdict: 'use' })}
        >
          <ThumbUpIcon /> Usaria
        </button>
        <button
          type="button"
          className="fb-btn"
          aria-pressed={feedback?.verdict === 'skip'}
          onClick={() => update({ verdict: 'skip' })}
        >
          <ThumbDownIcon /> Não usaria
        </button>
      </div>

      {feedback?.verdict === 'skip' && (
        <div className="fb-reasons" role="group" aria-label="Por que não usaria?">
          {REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className="fb-reason"
              aria-pressed={feedback.reasons.includes(r.id)}
              onClick={() => update({ toggleReason: r.id })}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <p className="fb-saved" aria-live="polite">
        {feedback && 'Obrigado! Fica só na memória desta página (some ao recarregar) e dá para mudar quando quiser.'}
      </p>
    </div>
  )
}
