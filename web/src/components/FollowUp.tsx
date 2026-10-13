import { useRef, useState, type FormEvent } from 'react'
import type { DemoContent } from '../lib/demo'
import { SHORTCUTS, answerFor, matchShortcut, type FollowUpAnswer, type FollowUpEntry, type Shortcut } from '../lib/followup'
import { explain, type Detail } from '../lib/preferences'
import { COPY_FALLBACK_MESSAGE, useCopy } from '../lib/useCopy'
import { CopyButton } from './CopyButton'
import { SendIcon } from './Icons'

interface Props {
  scenario: DemoContent
  /** Acompanhamento do resultado atual (no store, para salvar e continuar). */
  entries: FollowUpEntry[]
  onAdd: (entry: Omit<FollowUpEntry, 'id'>) => void
  detail: Detail | null
  onCopied: () => void
}

export function FollowUp({ scenario, entries, onAdd, detail, onCopied }: Props) {
  const [input, setInput] = useState('')

  function ask(question: string, shortcut: Shortcut | null) {
    onAdd({ question, answer: answerFor(scenario, shortcut) })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question) return
    ask(question, matchShortcut(question))
    setInput('')
  }

  return (
    <section className="card follow-up" aria-labelledby="follow-up-title">
      <h3 id="follow-up-title" className="card-title">
        Pergunte ou conte o que aconteceu
      </h3>

      <div className="shortcut-row" role="group" aria-label="Atalhos">
        {SHORTCUTS.map((s) => (
          <button key={s.id} type="button" className="chip-btn" onClick={() => ask(s.label, s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {entries.length > 0 && (
        <div role="log" aria-live="polite" aria-label="Respostas">
          <ol className="thread">
            {entries.map((e) => (
              <li key={e.id} className="thread-item">
                <p className="bubble bubble-user">{e.question}</p>
                <Answer entryId={e.id} answer={e.answer} detail={detail} onCopied={onCopied} />
              </li>
            ))}
          </ol>
        </div>
      )}

      <form className="ask-form" onSubmit={onSubmit}>
        <label htmlFor="follow-up-input" className="visually-hidden">
          Pergunte ou conte o que aconteceu
        </label>
        <input
          id="follow-up-input"
          type="text"
          autoComplete="off"
          placeholder="Pergunte ou conte o que aconteceu"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-send" disabled={!input.trim()} aria-label="Enviar">
          <SendIcon />
        </button>
      </form>
    </section>
  )
}

function Answer({
  entryId,
  answer,
  detail,
  onCopied,
}: {
  entryId: number
  answer: FollowUpAnswer
  detail: Detail | null
  onCopied: () => void
}) {
  if (answer.kind === 'not-connected') {
    return (
      <div className="bubble bubble-bot is-muted">
        <p>
          Ainda não consigo responder perguntas ou relatos livres: a resposta real será conectada depois. Nesta demonstração, só os
          atalhos acima têm respostas de exemplo.
        </p>
      </div>
    )
  }

  return (
    <div className="bubble bubble-bot">
      <span className="tag">Exemplo preparado</span>
      {answer.kind === 'her-reply' ? (
        <HerReply entryId={entryId} answer={answer} detail={detail} onCopied={onCopied} />
      ) : (
        <p>{explain(answer.text, detail)}</p>
      )}
    </div>
  )
}

function HerReply({
  entryId,
  answer,
  detail,
  onCopied,
}: {
  entryId: number
  answer: Extract<FollowUpAnswer, { kind: 'her-reply' }>
  detail: Detail | null
  onCopied: () => void
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { state, copy } = useCopy(ref, onCopied)
  const textId = `her-reply-${entryId}`
  return (
    <>
      <p>Imagine que, no cenário de exemplo, ela respondeu:</p>
      <blockquote className="her-message">{answer.message}</blockquote>
      <p>
        <strong>Leitura:</strong> {explain(answer.reading, detail)}
      </p>
      <div className="her-suggestion">
        <p className="her-suggestion-label">Sugestão de resposta</p>
        <p ref={ref} id={textId} className="suggestion-text">
          {answer.suggestion}
        </p>
        <div className="suggestion-foot">
          <CopyButton state={state} onClick={copy} describedBy={textId} />
        </div>
        <p className="copy-fallback" role="alert">
          {state === 'failed' && COPY_FALLBACK_MESSAGE}
        </p>
      </div>
    </>
  )
}
