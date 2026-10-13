import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { copyText, selectElementText } from './clipboard'

export type CopyState = 'idle' | 'copied' | 'failed'

/**
 * Copia o texto visível do elemento (innerText), não um dado paralelo: assim a cópia
 * sempre corresponde à versão que está na tela. Se falhar, seleciona o texto para cópia manual.
 */
export function useCopy(targetRef: RefObject<HTMLElement | null>, onCopied?: () => void) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = useCallback(async () => {
    const el = targetRef.current
    if (!el) return
    window.clearTimeout(timer.current)
    if (await copyText(el.innerText.trim())) {
      setState('copied')
      onCopied?.()
      timer.current = window.setTimeout(() => setState('idle'), 2000)
    } else {
      setState('failed')
      selectElementText(el)
    }
  }, [targetRef, onCopied])

  const reset = useCallback(() => {
    window.clearTimeout(timer.current)
    setState('idle')
  }, [])

  return { state, copy, reset }
}

export const COPY_FALLBACK_MESSAGE =
  'Não deu para copiar automaticamente. O texto já está selecionado: use Ctrl+C (⌘C no Mac) ou toque e segure para copiar.'
