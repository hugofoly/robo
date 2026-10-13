import { useCallback, useEffect, useRef, useState } from 'react'
import type { DemoRequest } from './demo'

/** Duração do carregamento simulado. Nenhuma requisição é feita. */
const SIMULATED_DELAY_MS = 1400

/** Estado transitório da geração; o resultado em si vai para o store da área. */
export type GenerationStatus =
  | { status: 'idle' }
  | { status: 'loading'; request: DemoRequest }
  | { status: 'error'; request: DemoRequest }

/**
 * Geração simulada, compartilhada pelo Assistente e pelos Modos especiais. A trava síncrona
 * impede que um duplo clique inicie duas gerações. Gerar não salva nada no histórico.
 */
export function useDemoGeneration(onSuccess: (request: DemoRequest) => void) {
  const [status, setStatus] = useState<GenerationStatus>({ status: 'idle' })
  const [failNext, setFailNext] = useState(false)
  const failNextRef = useRef(false)
  failNextRef.current = failNext
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess
  const statusRef = useRef(status)
  statusRef.current = status
  const inFlight = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      inFlight.current = false
    },
    [],
  )

  const run = useCallback((request: DemoRequest) => {
    if (inFlight.current) return
    inFlight.current = true
    const shouldFail = failNextRef.current
    if (shouldFail) setFailNext(false)
    setStatus({ status: 'loading', request })
    timer.current = window.setTimeout(() => {
      inFlight.current = false
      if (shouldFail) {
        setStatus({ status: 'error', request })
      } else {
        setStatus({ status: 'idle' })
        onSuccessRef.current(request)
      }
    }, SIMULATED_DELAY_MS)
  }, [])

  const retry = useCallback(() => {
    const s = statusRef.current
    if (s.status === 'error') run(s.request)
  }, [run])

  return { status, run, retry, failNext, setFailNext, loading: status.status === 'loading' }
}
