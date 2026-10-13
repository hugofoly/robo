import { useEffect, useRef, useState } from 'react'
import { copyText, selectElementText } from '../lib/clipboard'
import { CheckIcon, CopyIcon, StarIcon } from './Icons'

interface Props {
  id: string
  tone: string
  text: string
  recommended: boolean
  reason?: string
  onCopied: () => void
}

type CopyState = 'idle' | 'copied' | 'failed'

export function SuggestionCard({ id, tone, text, recommended, reason, onCopied }: Props) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [state, setState] = useState<CopyState>('idle')
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  async function copy() {
    const el = textRef.current
    if (!el) return
    // Copia exatamente o que está na tela, não uma cópia paralela do dado.
    const visible = el.innerText.trim()
    window.clearTimeout(resetTimer.current)
    if (await copyText(visible)) {
      setState('copied')
      onCopied()
      resetTimer.current = window.setTimeout(() => setState('idle'), 2000)
    } else {
      setState('failed')
      selectElementText(el)
    }
  }

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

      <p ref={textRef} id={`${id}-text`} className="suggestion-text">
        {text}
      </p>

      {recommended && reason && (
        <p className="suggestion-reason">
          <strong>Por quê:</strong> {reason}
        </p>
      )}

      <div className="suggestion-foot">
        <button
          type="button"
          className={`btn-copy${state === 'copied' ? ' is-copied' : ''}`}
          onClick={copy}
          aria-describedby={`${id}-text`}
        >
          {state === 'copied' ? <CheckIcon /> : <CopyIcon />}
          {state === 'copied' ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <p className="copy-fallback" role="alert">
        {state === 'failed' &&
          'Não deu para copiar automaticamente. O texto acima já está selecionado: use Ctrl+C (⌘C no Mac) ou toque e segure para copiar.'}
      </p>
    </article>
  )
}
