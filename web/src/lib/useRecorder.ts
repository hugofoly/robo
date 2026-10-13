import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_RECORDING_MS, type MicError } from './audio'

export type RecorderState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'recording'; elapsedMs: number }
  | { status: 'error'; error: MicError }

interface Options {
  /** Chamado ao finalizar (Parar ou limite de tempo). Nunca é chamado ao cancelar. */
  onComplete: (blob: Blob, durationMs: number, reachedLimit: boolean) => void
}

function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t))
}

function classify(err: unknown): MicError {
  const name = err instanceof DOMException || err instanceof Error ? err.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') return 'no-device'
  if (name === 'NotReadableError' || name === 'AbortError') return 'failed'
  return 'unavailable'
}

/**
 * Grava com MediaRecorder, só em memória. O microfone é liberado (tracks parados) ao finalizar,
 * ao cancelar, ao desmontar o componente e quando a página é fechada ou trocada.
 */
export function useRecorder({ onComplete }: Options) {
  const [state, setState] = useState<RecorderState>({ status: 'idle' })
  const stream = useRef<MediaStream | null>(null)
  /** Gravação atual; `discarded` é por gravação, para um cancelamento não afetar a próxima. */
  const current = useRef<{ rec: MediaRecorder; discarded: boolean; reachedLimit: boolean } | null>(null)
  const startedAt = useRef(0)
  const ticker = useRef<number | undefined>(undefined)
  /** Incrementa a cada start/cancel para ignorar um getUserMedia que resolve depois de cancelado. */
  const session = useRef(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const releaseMic = useCallback(() => {
    window.clearInterval(ticker.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
  }, [])

  const stop = useCallback(() => {
    const r = current.current?.rec
    if (r && r.state !== 'inactive') r.stop()
    // Libera o microfone já, sem esperar o evento `stop` do MediaRecorder.
    releaseMic()
  }, [releaseMic])

  const cancel = useCallback(() => {
    session.current += 1
    if (current.current) current.current.discarded = true
    stop()
    current.current = null
    setState({ status: 'idle' })
  }, [stop])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setState({ status: 'error', error: 'unavailable' })
      return
    }
    const mySession = ++session.current
    setState({ status: 'requesting' })
    let media: MediaStream
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      if (mySession === session.current) setState({ status: 'error', error: classify(err) })
      return
    }
    if (mySession !== session.current) {
      // Cancelado (ou componente desmontado) enquanto o navegador pedia permissão.
      media.getTracks().forEach((t) => t.stop())
      return
    }

    let rec: MediaRecorder
    try {
      const mimeType = pickMimeType()
      rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined)
    } catch {
      media.getTracks().forEach((t) => t.stop())
      setState({ status: 'error', error: 'failed' })
      return
    }

    stream.current = media
    const entry = { rec, discarded: false, reachedLimit: false }
    current.current = entry
    const chunks: Blob[] = []
    const began = Date.now()

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    rec.onstop = () => {
      if (stream.current === media) releaseMic()
      else media.getTracks().forEach((t) => t.stop())
      if (current.current === entry) current.current = null
      if (entry.discarded) return
      setState({ status: 'idle' })
      const durationMs = Math.min(Date.now() - began, MAX_RECORDING_MS)
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
      if (blob.size > 0) onCompleteRef.current(blob, durationMs, entry.reachedLimit)
    }

    startedAt.current = began
    rec.start(250)
    setState({ status: 'recording', elapsedMs: 0 })
    ticker.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt.current
      if (elapsed >= MAX_RECORDING_MS) {
        entry.reachedLimit = true
        setState({ status: 'recording', elapsedMs: MAX_RECORDING_MS })
        stop()
      } else {
        setState({ status: 'recording', elapsedMs: elapsed })
      }
    }, 200)
  }, [releaseMic, stop])

  const clearError = useCallback(() => setState({ status: 'idle' }), [])

  // Sair: desmontar o componente ou fechar/trocar a página encerra e descarta a gravação.
  useEffect(() => {
    window.addEventListener('pagehide', cancel)
    return () => {
      window.removeEventListener('pagehide', cancel)
      cancel()
    }
  }, [cancel])

  return { state, start, stop, cancel, clearError }
}
