import { useCallback, useState } from 'react'

export type Verdict = 'use' | 'skip'
export type Reason = 'generic' | 'over' | 'not-me'

export const REASONS: { id: Reason; label: string }[] = [
  { id: 'generic', label: 'Genérica' },
  { id: 'over', label: 'Exagerada' },
  { id: 'not-me', label: 'Não parece comigo' },
]

export interface Feedback {
  verdict: Verdict
  reasons: Reason[]
}

const STORAGE_KEY = 'robo:feedback:v1'

// Fica só na sessão da aba (sessionStorage). Se o navegador bloquear, cai para memória.
let memory: Record<string, Feedback> = {}

function readAll(): Record<string, Feedback> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, Feedback>) : memory
  } catch {
    return memory
  }
}

function writeAll(all: Record<string, Feedback>) {
  memory = all
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Sem sessionStorage: mantém em memória até recarregar.
  }
}

export function getFeedback(key: string): Feedback | null {
  return readAll()[key] ?? null
}

export function setFeedback(key: string, value: Feedback | null) {
  const all = { ...readAll() }
  if (value) all[key] = value
  else delete all[key]
  writeAll(all)
}

/** Clicar no veredito ativo desmarca; trocar para "Usaria" limpa os motivos. */
export function nextFeedback(current: Feedback | null, action: { verdict: Verdict } | { toggleReason: Reason }): Feedback | null {
  if ('verdict' in action) {
    if (current?.verdict === action.verdict) return null
    return { verdict: action.verdict, reasons: [] }
  }
  if (current?.verdict !== 'skip') return current
  const has = current.reasons.includes(action.toggleReason)
  return { verdict: 'skip', reasons: has ? current.reasons.filter((r) => r !== action.toggleReason) : [...current.reasons, action.toggleReason] }
}

export function useSessionFeedback(key: string) {
  const [state, setState] = useState(() => ({ key, value: getFeedback(key) }))
  // A chave muda quando a versão do card muda: relê o que foi salvo para ela.
  const value = state.key === key ? state.value : getFeedback(key)
  if (state.key !== key) setState({ key, value })

  const update = useCallback(
    (action: Parameters<typeof nextFeedback>[1]) => {
      const next = nextFeedback(getFeedback(key), action)
      setFeedback(key, next)
      setState({ key, value: next })
    },
    [key],
  )
  return [value, update] as const
}
