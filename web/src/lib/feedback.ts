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

