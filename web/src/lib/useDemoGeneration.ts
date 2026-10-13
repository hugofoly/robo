import { useCallback, useEffect, useRef, useState } from 'react'
import type { DemoRequest } from './demo'

/** Duração do carregamento simulado. Nenhuma requisição é feita. */
const SIMULATED_DELAY_MS = 1400

export type Generation =
  | { status: 'idle' }
  | { status: 'loading'; request: DemoRequest }
  | { status: 'success'; request: DemoRequest; runId: number }
  | { status: 'error'; request: DemoRequest }

/**
 * Geração simulada e efêmera (sem histórico), compartilhada pelo Assistente e pelos Modos especiais.
 * A trava síncrona impede que um duplo clique inicie duas gerações.
 */
export function useDemoGeneration() {
  const [generation, setGeneration] = useState<Generation>({ status: 'idle' })
  const [failNext, setFailNext] = useState(false)
  const failNextRef = useRef(false)
  failNextRef.current = failNext
  const inFlight = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  const runId = useRef(0)
  const generationRef = useRef(generation)
  generationRef.current = generation

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const run = useCallback((request: DemoRequest) => {
    if (inFlight.current) return
    inFlight.current = true
    const shouldFail = failNextRef.current
    if (shouldFail) setFailNext(false)
    setGeneration({ status: 'loading', request })
    timer.current = window.setTimeout(() => {
      inFlight.current = false
      runId.current += 1
      setGeneration(shouldFail ? { status: 'error', request } : { status: 'success', request, runId: runId.current })
    }, SIMULATED_DELAY_MS)
  }, [])

  const retry = useCallback(() => {
    const g = generationRef.current
    if (g.status === 'error') run(g.request)
  }, [run])

  return { generation, run, retry, failNext, setFailNext, loading: generation.status === 'loading' }
}
