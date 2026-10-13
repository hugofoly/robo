import { TONES, type Tone } from './demo'

export type Detail = 'short' | 'detailed'

/** Preferências opcionais; `null` = sem preferência (comportamento padrão). Duram só até recarregar. */
export interface Preferences {
  tone: Tone | null
  detail: Detail | null
}

export const NO_PREFERENCES: Preferences = { tone: null, detail: null }

export const TONE_PREF_OPTIONS: { id: Tone | 'none'; label: string }[] = [
  { id: 'none', label: 'Nenhum' },
  { id: 'light', label: 'Leve' },
  { id: 'confident', label: 'Confiante' },
  { id: 'bold', label: 'Ousado' },
]

export const DETAIL_OPTIONS: { id: Detail | 'none'; label: string }[] = [
  { id: 'none', label: 'Padrão' },
  { id: 'short', label: 'Curta' },
  { id: 'detailed', label: 'Detalhada' },
]

/** Tom preferido vem primeiro; os outros mantêm a ordem original. */
export function orderTones(tone: Tone | null): typeof TONES {
  if (!tone) return TONES
  return [...TONES.filter((t) => t.id === tone), ...TONES.filter((t) => t.id !== tone)]
}

/**
 * Primeira frase de um texto (até o primeiro ponto final, exclamação ou interrogação seguido de espaço).
 * Se o texto inteiro é uma frase só, corta na primeira ideia, antes de ":".
 */
export function firstSentence(text: string): string {
  const m = text.match(/^(.+?[.!?])(\s|$)/)
  const sentence = m ? m[1] : text
  if (sentence !== text.trim()) return sentence
  const colon = sentence.indexOf(': ')
  return colon > 0 ? `${sentence.slice(0, colon)}.` : sentence
}

/** Explicação "Curta" usa só a primeira frase; padrão e "Detalhada" usam o texto completo. */
export function explain(text: string, detail: Detail | null): string {
  return detail === 'short' ? firstSentence(text) : text
}
